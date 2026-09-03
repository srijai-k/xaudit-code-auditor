import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { traverseAst, locOf, isStaticStringExpression, isSanitizerWrapped, resolveSingleAssignment, excerptOf } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding } from "../types";

/**
 * Rule group A — DOM XSS / unsafe HTML injection.
 *
 * Detects, via direct AST relationships plus one same-scope variable hop
 * (see ast-utils.ts's resolveSingleAssignment — not general data-flow):
 *   - `x.innerHTML = expr` / `x.outerHTML = expr`
 *   - `x.srcdoc = expr` (an iframe's inline document — same risk class as
 *     innerHTML: it's rendered as a full HTML document, scripts and all)
 *   - `x.insertAdjacentHTML(pos, expr)`
 *   - `document.write(expr)` / `document.writeln(expr)`
 *   - React `dangerouslySetInnerHTML={{ __html: expr }}`, including when
 *     the whole `{ __html: expr }` object is itself one variable hop away
 *     (`const props = { __html: expr }; <div dangerouslySetInnerHTML={props} />`)
 *   - A `javascript:` URI assigned to `location`/`location.href` (or
 *     `window.location`/`document.location`), passed to
 *     `el.setAttribute('href'|'src', ...)`, or used as a JSX `href` prop —
 *     but ONLY when the literal string `javascript:` actually appears in
 *     the source, concatenated or interpolated with a dynamic value (see
 *     isJavascriptUriConcatenation below). This was deliberately NOT
 *     implemented as "any dynamic value reaching location.href" — that
 *     shape is an extremely common, almost always legitimate redirect
 *     pattern, and flagging it broadly would repeat the exact mistake the
 *     reverted import()/require() check made. Requiring the `javascript:`
 *     scheme literal to be physically present in the code narrows this to
 *     a shape that's vanishingly rare in legitimate code (nobody
 *     constructs a `javascript:` URI from scratch for a normal redirect)
 *     while still catching the real, classic vulnerability: building an
 *     executable URI by hand instead of validating a scheme/allowlist.
 *   - jQuery/AngularJS-jqLite `x.html(expr)`, but ONLY when `x` is
 *     recognizably jQuery/jqLite-sourced (see isJquerySourced below) — a
 *     bare `.html()` call name alone is not a strong enough signal by
 *     itself, the same reasoning that gates `.query()` in sqli.ts by
 *     receiver shape rather than flagging every `.query()` in existence.
 *     Deliberately narrower than jQuery's full HTML-injection surface:
 *     `.append()`/`.prepend()`/`.after()`/`.before()`/`.replaceWith()` are
 *     NOT covered, because unlike `.html()` those are routinely called
 *     with a DOM/jQuery element reference (completely safe) rather than a
 *     string, and "the argument isn't a literal" is a much weaker signal
 *     there — exactly the kind of gap between "technically possible" and
 *     "would actually misfire on real code" that the reverted
 *     import()/require() check got wrong. See docs/model-improvements.md.
 *
 * A finding is only raised when the value isn't provably a static string —
 * checked either directly at the sink, or by tracing an identifier back one
 * hop to a `const`/`let` declaration that's never reassigned. That one-hop
 * trace is new and fixes a real bug this rule shipped with: previously
 * `const safe = "<b>hi</b>"; el.innerHTML = safe;` was flagged, because an
 * Identifier is never a StringLiteral or TemplateLiteral by syntax alone —
 * the rule couldn't tell "safe" traced back to a literal. Verified before
 * this fix (see docs/model-improvements.md): it flagged that exact snippet
 * as high-severity XSS. It doesn't anymore.
 *
 * The same one-hop trace also lets the sanitizer check see through a
 * variable: `const clean = DOMPurify.sanitize(x); el.innerHTML = clean;` is
 * now recognized as sanitized (downgraded to low), where before the
 * sanitizer call was invisible behind the identifier.
 *
 * Explicitly out of scope, by design: this rule never inspects JSX event
 * props (`onClick`, `onChange`, `onSubmit`, etc.). Those are React
 * synthetic event handlers, not raw HTML attributes, and are not part of
 * this rule's pattern set at all — there is no shared regex or AST
 * selector between "innerHTML-like sink" and "on* JSX prop" in this
 * module, so there is nothing here that could conflate the two.
 *
 * Limitations (always disclosed, never hidden):
 *   - The variable trace is exactly one hop and never crosses a function
 *     boundary: `const a = "<b>x</b>"; const b = a; el.innerHTML = b;`
 *     is NOT resolved (b traces to identifier `a`, not to a literal) — a
 *     real false positive this version still has, disclosed rather than
 *     silently pretended away. A function parameter (`function f(userInput)`)
 *     is never resolvable to a declaration at all, so it's still always
 *     treated as dynamic — which is the common, correct real-world case.
 *   - Aliasing (`const el2 = el; el2.innerHTML = x`) is followed only one
 *     level for the receiver name via the member expression itself; a
 *     wrapper function that internally does the assignment is not tracked.
 *   - Sanitizer recognition is name-based, not semantic, even through the
 *     variable trace.
 */

const HTML_MEMBER_PROPS = new Set(["innerHTML", "outerHTML", "srcdoc"]);

const HTML_PROP_RULE_ID: Record<string, string> = {
    innerHTML: "xss-inner-html",
    outerHTML: "xss-outer-html",
    srcdoc: "xss-iframe-srcdoc",
};

/**
 * True for `$(...)`/`jQuery(...)` and any member/call chain rooted at one
 * of those — `$('.x').find('.y')`, `$('.x').html(...)`'s own object, etc.
 * Depth-capped defensively; jQuery chains are never meaningfully deep.
 */
function isJqueryRootedChain(node: t.Node, depth = 0): boolean {
    if (depth > 8) return false;
    if (t.isCallExpression(node) && t.isIdentifier(node.callee) && (node.callee.name === "$" || node.callee.name === "jQuery")) {
        return true;
    }
    if (t.isCallExpression(node) && t.isMemberExpression(node.callee)) {
        return isJqueryRootedChain(node.callee.object, depth + 1);
    }
    if (t.isMemberExpression(node)) {
        // `this.$el`/`self.$container`-style cached-object access (the
        // Backbone.View/jQuery-widget convention) matches the naming
        // convention on its own, regardless of what it's accessed off —
        // checked before recursing into the object, so a chain like
        // `this.$container.find('.bio')` matches at the `this.$container`
        // link without needing `this` itself to resolve to anything.
        if (!node.computed && t.isIdentifier(node.property) && node.property.name.startsWith("$") && node.property.name.length > 1) {
            return true;
        }
        return isJqueryRootedChain(node.object, depth + 1);
    }
    return false;
}

/**
 * True when the receiver of a `.html(...)` call is recognizably a
 * jQuery/jqLite object: a direct `$(...)`/`jQuery(...)`-rooted chain, a
 * variable one hop back that was assigned from one, or — since neither of
 * those catches the extremely common case of a jQuery/jqLite object passed
 * in as a function parameter, e.g. a jQuery plugin's `function(el) { ... }`
 * or an AngularJS 1.x directive's `link(scope, $element)`, or a
 * Backbone.View-style `this.$el`/`this.$container` cached on an instance —
 * a bare identifier, OR a `.$name` property access on anything, that
 * follows the jQuery convention of a `$`-prefixed name (`$el`,
 * `$container`, AngularJS's own `$element`/`$document`, which are real
 * jqLite-wrapped objects supporting the same `.html()` API). That
 * last check is a naming-convention heuristic, not a structural one —
 * disclosed as such in the finding's limitations, same as this project's
 * other name-based signals (secrets.ts's credential-name pattern,
 * sqli.ts's db-receiver-name pattern).
 */
function isJquerySourced(path: NodePath, node: t.Node): boolean {
    if (isJqueryRootedChain(node)) return true;
    if (t.isIdentifier(node)) {
        if (node.name.startsWith("$") && node.name.length > 1) return true;
        const resolved = resolveSingleAssignment(path, node);
        if (resolved.resolved && resolved.initNode && isJqueryRootedChain(resolved.initNode)) return true;
    }
    return false;
}

const JAVASCRIPT_URI_SCHEME = /^\s*javascript:/i;

/**
 * True only when `node` is a `+` concatenation or template literal whose
 * FIRST literal segment is physically the `javascript:` scheme in the
 * source — not "any dynamic value," which would be far too broad (see the
 * module doc comment for why). One-hop variable resolution is handled by
 * the caller via resolveSingleAssignment, same as every other sink here.
 */
function isJavascriptUriConcatenation(node: t.Node): boolean {
    if (t.isBinaryExpression(node) && node.operator === "+") {
        let left: t.Node = node.left;
        while (t.isBinaryExpression(left) && left.operator === "+") left = left.left;
        return t.isStringLiteral(left) && JAVASCRIPT_URI_SCHEME.test(left.value);
    }
    if (t.isTemplateLiteral(node)) {
        const first = node.quasis[0];
        if (!first || node.expressions.length === 0) return false;
        return JAVASCRIPT_URI_SCHEME.test(first.value.cooked ?? first.value.raw ?? "");
    }
    return false;
}

/** Resolves a javascript:-URI check through one variable hop, mirroring resolveForXss. */
function resolveForJavascriptUri(path: NodePath, node: t.Node): { isJsUri: boolean; tracedVia?: string } {
    if (isJavascriptUriConcatenation(node)) return { isJsUri: true };
    if (t.isIdentifier(node)) {
        const resolved = resolveSingleAssignment(path, node);
        if (resolved.resolved && resolved.initNode && isJavascriptUriConcatenation(resolved.initNode)) {
            return { isJsUri: true, tracedVia: node.name };
        }
    }
    return { isJsUri: false };
}

function makeJavascriptUriFinding(ruleId: string, title: string, node: t.Node, code: string, tracedVia: string | undefined): Finding {
    const traceNote = tracedVia ? ` (traced back one step to the declaration of \`${tracedVia}\`)` : "";
    return {
        ruleId,
        title,
        severity: "high",
        category: "xss",
        message: `${title}: the value is built by concatenating the literal \`javascript:\` scheme with a dynamic value${traceNote}, which executes as script when navigated to or set as an href/src.`,
        whyItMatters:
            "A javascript: URI runs as script the moment it's navigated to (a click, a redirect, or certain img/iframe src contexts). Building one by hand from a dynamic value is a direct code-execution path if any part of that value is attacker-influenced.",
        saferExample:
            "Validate the destination against an allowlist of schemes/paths before using it (e.g. reject anything not starting with '/' or 'https://'), and never construct a javascript: URI programmatically.",
        limitations:
            "Only catches the scheme literal `javascript:` written directly in the source and concatenated with a dynamic value — a value that merely *might* contain \"javascript:\" at runtime (e.g. a plain `location.href = userInput` with no literal scheme in sight) is not flagged at all, deliberately, since that shape is indistinguishable from an ordinary, legitimate redirect without data-flow analysis this engine doesn't have.",
        location: locOf(node),
        snippet: excerptOf(code, node),
    };
}

const LOCATION_ASSIGNMENT_TARGETS = new Set(["location", "href"]);

/** True for `location`, `location.href`, `window.location`, `window.location.href`, `document.location`, `document.location.href`. */
function isLocationAssignmentTarget(node: t.Node): boolean {
    if (t.isIdentifier(node)) return node.name === "location";
    if (!t.isMemberExpression(node) || node.computed || !t.isIdentifier(node.property)) return false;
    if (!LOCATION_ASSIGNMENT_TARGETS.has(node.property.name)) return false;
    const obj = node.object;
    if (t.isIdentifier(obj)) return obj.name === "location" || obj.name === "window" || obj.name === "document";
    // window.location.href / document.location.href
    if (t.isMemberExpression(obj) && !obj.computed && t.isIdentifier(obj.property) && obj.property.name === "location") {
        return t.isIdentifier(obj.object) && (obj.object.name === "window" || obj.object.name === "document");
    }
    return false;
}

function memberPropName(node: t.Node): string | undefined {
    if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
        return node.property.name;
    }
    return undefined;
}

interface Resolution {
    isStatic: boolean;
    /** The node to run the sanitizer check against — the traced-to value when a trace succeeded, else the original. */
    effectiveNode: t.Node;
    /** Set when resolution went through a variable, for the finding message. */
    tracedVia?: string;
}

/** Resolves whether a sink's value is effectively static, trying one variable hop if it's a bare identifier. */
function resolveForXss(path: NodePath, node: t.Node): Resolution {
    if (isStaticStringExpression(node)) return { isStatic: true, effectiveNode: node };
    if (t.isIdentifier(node)) {
        const resolved = resolveSingleAssignment(path, node);
        if (resolved.resolved && resolved.initNode) {
            return {
                isStatic: isStaticStringExpression(resolved.initNode),
                effectiveNode: resolved.initNode,
                tracedVia: node.name,
            };
        }
    }
    return { isStatic: false, effectiveNode: node };
}

function makeFinding(ruleId: string, title: string, node: t.Node, code: string, resolution: Resolution): Finding {
    const sanitized = isSanitizerWrapped(resolution.effectiveNode);
    const traceNote = resolution.tracedVia
        ? ` (traced back one step to the declaration of \`${resolution.tracedVia}\`)`
        : "";
    return {
        ruleId,
        title,
        severity: sanitized ? "low" : "high",
        category: "xss",
        message: sanitized
            ? `${title}: the value passed appears to be wrapped in a sanitizer call${traceNote}, but this cannot be verified as safe — it only reduces likelihood.`
            : `${title}: the value assigned is not a static string literal${traceNote}, so it cannot be confirmed safe from this syntax alone.`,
        whyItMatters:
            "If the value ever includes attacker-influenced text (URL params, API responses, user-entered fields) and reaches this sink unescaped, it can execute arbitrary script in the page (DOM-based XSS). This rule cannot confirm the value is actually attacker-controlled — it flags the sink shape only.",
        saferExample: sanitized
            ? "Sanitizer detected. Confirm it is imported from a real, maintained library (e.g. `dompurify`) and configured with an allowlist appropriate for your content."
            : "Use `element.textContent = value` for plain text, or sanitize first: `element.innerHTML = DOMPurify.sanitize(value)`.",
        limitations:
            ruleId === "xss-jquery-html"
                ? "Direct AST match plus one same-scope variable hop, same as the other sinks in this rule — but the receiver check that gates this one is partly a naming convention (a `$`-prefixed identifier, e.g. `$el`), not purely structural, so a non-jQuery/jqLite object that happens to be named that way and happens to have its own unrelated `.html()` method could misfire (false positive), and a jQuery object passed under a differently-named variable through an unresolvable path could be missed (false negative)."
                : "Direct AST match plus one same-scope variable hop — not full data-flow/taint analysis. A value traced through two or more variables, or assembled in a different function, will not be resolved (false negative). A sanitizer name match does not verify safe configuration.",
        location: locOf(node),
        snippet: excerptOf(code, node),
    };
}

export const xssRule: Rule = {
    id: "xss",
    category: "xss",
    title: "DOM XSS / unsafe HTML injection",
    run(ctx: RuleContext): Finding[] {
        const findings: Finding[] = [];
        const { ast, code } = ctx;

        traverseAst(ast, {
            AssignmentExpression(path) {
                const { node } = path;
                if (node.operator !== "=") return;

                if (isLocationAssignmentTarget(node.left) && t.isExpression(node.right)) {
                    const jsUri = resolveForJavascriptUri(path, node.right);
                    if (jsUri.isJsUri) {
                        findings.push(makeJavascriptUriFinding("xss-location-javascript-uri", "javascript: URI assigned to location", node, code, jsUri.tracedVia));
                    }
                    return;
                }

                const propName = memberPropName(node.left);
                if (!propName || !HTML_MEMBER_PROPS.has(propName)) return;
                const resolution = resolveForXss(path, node.right);
                if (resolution.isStatic) return; // literal HTML, directly or traced — not flagged
                findings.push(
                    makeFinding(
                        HTML_PROP_RULE_ID[propName],
                        `Unsanitized assignment to .${propName}`,
                        node,
                        code,
                        resolution,
                    ),
                );
            },
            CallExpression(path) {
                const { node } = path;
                const callee = node.callee;
                if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property)) {
                    const propName = callee.property.name;
                    if (propName === "insertAdjacentHTML" && node.arguments.length >= 2) {
                        const htmlArg = node.arguments[1];
                        if (t.isExpression(htmlArg)) {
                            const resolution = resolveForXss(path, htmlArg);
                            if (!resolution.isStatic) {
                                findings.push(
                                    makeFinding("xss-insert-adjacent-html", "Unsanitized insertAdjacentHTML() call", node, code, resolution),
                                );
                            }
                        }
                        return;
                    }
                    if (propName === "setAttribute" && node.arguments.length >= 2) {
                        const attrArg = node.arguments[0];
                        const valueArg = node.arguments[1];
                        if (t.isStringLiteral(attrArg) && /^(href|src)$/i.test(attrArg.value) && t.isExpression(valueArg)) {
                            const jsUri = resolveForJavascriptUri(path, valueArg);
                            if (jsUri.isJsUri) {
                                findings.push(
                                    makeJavascriptUriFinding("xss-setattribute-javascript-uri", `javascript: URI passed to setAttribute('${attrArg.value}', ...)`, node, code, jsUri.tracedVia),
                                );
                            }
                        }
                        return;
                    }
                    if (propName === "html" && isJquerySourced(path, callee.object)) {
                        const arg = node.arguments[0];
                        if (arg && t.isExpression(arg)) {
                            const resolution = resolveForXss(path, arg);
                            if (!resolution.isStatic) {
                                findings.push(
                                    makeFinding("xss-jquery-html", "Unsanitized jQuery .html() call", node, code, resolution),
                                );
                            }
                        }
                        return;
                    }
                    if ((propName === "write" || propName === "writeln") && t.isIdentifier(callee.object) && callee.object.name === "document") {
                        const arg = node.arguments[0];
                        if (arg && t.isExpression(arg)) {
                            const resolution = resolveForXss(path, arg);
                            if (!resolution.isStatic) {
                                findings.push(
                                    makeFinding(
                                        propName === "write" ? "xss-document-write" : "xss-document-writeln",
                                        `Unsanitized document.${propName}() call`,
                                        node,
                                        code,
                                        resolution,
                                    ),
                                );
                            }
                        }
                    }
                }
            },
            JSXAttribute(path) {
                const { node } = path;
                if (t.isJSXIdentifier(node.name) && /^(href|src)$/i.test(node.name.name) && node.value && t.isJSXExpressionContainer(node.value) && t.isExpression(node.value.expression)) {
                    const jsUri = resolveForJavascriptUri(path, node.value.expression);
                    if (jsUri.isJsUri) {
                        findings.push(
                            makeJavascriptUriFinding("xss-jsx-href-javascript-uri", `javascript: URI in JSX ${node.name.name} prop`, node, code, jsUri.tracedVia),
                        );
                    }
                    return;
                }
                if (!t.isJSXIdentifier(node.name) || node.name.name !== "dangerouslySetInnerHTML") return;
                if (!node.value || !t.isJSXExpressionContainer(node.value)) return;
                let expr = node.value.expression;
                // The prop is very commonly built as a separate variable —
                // `const props = { __html: x }; <div dangerouslySetInnerHTML={props} />`
                // — rather than an inline object literal. Without this, that
                // whole (extremely common) pattern was invisible to this
                // rule: `expr` was an Identifier, never an ObjectExpression,
                // so the check below returned unconditionally and no finding
                // was ever possible, safe or not. Found via
                // tests/independent-benchmark, not written to fix a known
                // gap — see docs/model-improvements.md.
                if (t.isIdentifier(expr)) {
                    const resolved = resolveSingleAssignment(path, expr);
                    if (resolved.resolved && resolved.initNode && t.isObjectExpression(resolved.initNode)) {
                        expr = resolved.initNode;
                    }
                }
                if (!t.isObjectExpression(expr)) return;
                const htmlProp = expr.properties.find(
                    (p) => t.isObjectProperty(p) && !p.computed && t.isIdentifier(p.key) && p.key.name === "__html",
                );
                if (!htmlProp || !t.isObjectProperty(htmlProp)) return;
                const value = htmlProp.value;
                if (!t.isExpression(value)) return;
                const resolution = resolveForXss(path, value);
                if (resolution.isStatic) return;
                findings.push(
                    makeFinding("xss-dangerously-set-inner-html", "Unsanitized dangerouslySetInnerHTML", node, code, resolution),
                );
            },
        });

        return findings;
    },
};
