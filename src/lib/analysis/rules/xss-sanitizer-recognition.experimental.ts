import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { traverseAst, locOf, isStaticStringExpression, resolveSingleAssignment, excerptOf } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding } from "../types";

/**
 * EXPERIMENTAL — not registered in analyze.ts, not shipped, not run in CI
 * by default. See docs/experiments/xss-sanitizer-recognition/ for the full
 * protocol and report this module exists to test.
 *
 * This is a deliberately isolated, self-contained fork of xss.ts's sink
 * detection — sinks covered, one-hop variable resolution, and the
 * `javascript:`-URI group are copied verbatim (not imported from xss.ts,
 * so the production rule is never touched by this experiment) so that the
 * ONLY behavioral difference between this module and xss.ts is the
 * sanitizer-recognition predicate: `isNarrowDompurifySanitizeCall` here,
 * versus `isSanitizerWrapped` (ast-utils.ts) in production.
 *
 * Production's `isSanitizerWrapped` recognizes, and downgrades to `low`:
 *   - `<name matching /dompurify|xss|sanitize-html/i>.sanitize(x)` (intended)
 *   - any bare call `sanitize(x)` / `sanitizehtml(x)` / `sanitizeHtml(x)`,
 *     regardless of where that function actually came from
 *   - any member call `<anything>.sanitize(x)`, regardless of receiver name
 * The last two are real, disclosed-by-this-experiment false-confidence
 * risks: a same-file no-op function named `sanitize`, or an unrelated
 * `object.sanitize()` method, both get trusted by name alone today.
 *
 * This module's `isNarrowDompurifySanitizeCall` recognizes ONLY:
 *   - `DOMPurify.sanitize(x)` — the object is the literal identifier
 *     `DOMPurify` (covers both a global `<script>`-loaded DOMPurify and an
 *     `import DOMPurify from "dompurify"` default import using that exact
 *     local name), property literally `sanitize`, non-computed; OR
 *   - `<alias>.sanitize(x)` where `<alias>`'s binding is verified, via
 *     Babel's own scope resolution, to be an ImportDefaultSpecifier or
 *     ImportNamespaceSpecifier from the literal module source `"dompurify"`
 *     — covers `import * as DOMPurify from "dompurify"` under any alias,
 *     and `import SomeAlias from "dompurify"` used as `SomeAlias.sanitize(x)`; OR
 *   - a bare call `<alias>(x)` where `<alias>`'s binding is verified to be
 *     an ImportDefaultSpecifier from `"dompurify"` — covers
 *     `import sanitizeHtml from "dompurify"; sanitizeHtml(x)`.
 *
 * Deliberately NOT recognized, by design (see protocol.md's "Experimental
 * treatment" section for the full list and reasoning):
 *   - an arbitrary local function/variable merely named `sanitize`,
 *     `sanitizeHtml`, `clean`, or `purify` with no verified `dompurify` origin;
 *   - `<anything>.sanitize(x)` where `<anything>` is not the literal
 *     identifier `DOMPurify` and not a verified `dompurify` namespace import
 *     (e.g. `const purifier = DOMPurify; purifier.sanitize(x)` — a local
 *     alias of the identifier itself, as opposed to a verified import
 *     binding, is not traced);
 *   - a destructured `const { sanitize } = DOMPurify` binding, or the
 *     function reference `const clean = DOMPurify.sanitize` invoked later —
 *     neither is a call expression shaped like `DOMPurify.sanitize(...)` at
 *     the point it's actually called;
 *   - any cross-file imported wrapper, any value passed through a second
 *     variable hop, or a sanitizer call inside a helper function whose
 *     return value is trusted at the sink.
 * All of the above fail SAFE: they are simply not recognized as sanitized,
 * which means the existing sink logic's default (flag it, at whatever
 * severity a non-static value normally gets) applies unchanged. None of
 * this experiment's scope changes can ever cause a real vulnerability to
 * go unflagged that xss.ts would otherwise have flagged.
 */

const HTML_MEMBER_PROPS = new Set(["innerHTML", "outerHTML", "srcdoc"]);

const HTML_PROP_RULE_ID: Record<string, string> = {
    innerHTML: "xss-inner-html",
    outerHTML: "xss-outer-html",
    srcdoc: "xss-iframe-srcdoc",
};

// --- jQuery receiver detection (copied verbatim from xss.ts; unrelated to
// sanitizer recognition, needed only so this module covers the same sinks). ---

function isJqueryRootedChain(node: t.Node, depth = 0): boolean {
    if (depth > 8) return false;
    if (t.isCallExpression(node) && t.isIdentifier(node.callee) && (node.callee.name === "$" || node.callee.name === "jQuery")) {
        return true;
    }
    if (t.isCallExpression(node) && t.isMemberExpression(node.callee)) {
        return isJqueryRootedChain(node.callee.object, depth + 1);
    }
    if (t.isMemberExpression(node)) {
        if (!node.computed && t.isIdentifier(node.property) && node.property.name.startsWith("$") && node.property.name.length > 1) {
            return true;
        }
        return isJqueryRootedChain(node.object, depth + 1);
    }
    return false;
}

function isJquerySourced(path: NodePath, node: t.Node): boolean {
    if (isJqueryRootedChain(node)) return true;
    if (t.isIdentifier(node)) {
        if (node.name.startsWith("$") && node.name.length > 1) return true;
        const resolved = resolveSingleAssignment(path, node);
        if (resolved.resolved && resolved.initNode && isJqueryRootedChain(resolved.initNode)) return true;
    }
    return false;
}

// --- javascript:-URI detection (copied verbatim from xss.ts; sanitizer
// recognition is never consulted for this group, in baseline or here). ---

const JAVASCRIPT_URI_SCHEME = /^\s*javascript:/i;

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
            "[EXPERIMENTAL BUILD] Only catches the scheme literal `javascript:` written directly in the source and concatenated with a dynamic value. Sanitizer recognition is never consulted for this sink group, in baseline or here.",
        location: locOf(node),
        snippet: excerptOf(code, node),
    };
}

const LOCATION_ASSIGNMENT_TARGETS = new Set(["location", "href"]);

function isLocationAssignmentTarget(node: t.Node): boolean {
    if (t.isIdentifier(node)) return node.name === "location";
    if (!t.isMemberExpression(node) || node.computed || !t.isIdentifier(node.property)) return false;
    if (!LOCATION_ASSIGNMENT_TARGETS.has(node.property.name)) return false;
    const obj = node.object;
    if (t.isIdentifier(obj)) return obj.name === "location" || obj.name === "window" || obj.name === "document";
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

// --- The one piece that actually differs from xss.ts: narrow, structural
// DOMPurify recognition instead of ast-utils.ts's isSanitizerWrapped. ---

/**
 * True only when `name`'s binding (Babel's own scope resolution — not a
 * text/name heuristic) is an import specifier from the literal module
 * source `"dompurify"`. Verifies the import's real origin, not the local
 * name it was given, which is what makes this safe to trust for an
 * arbitrarily-aliased default or namespace import.
 */
function isVerifiedDompurifyImportBinding(path: NodePath, name: string): boolean {
    const binding = path.scope.getBinding(name);
    if (!binding) return false;
    const specifier = binding.path.node;
    if (!t.isImportDefaultSpecifier(specifier) && !t.isImportNamespaceSpecifier(specifier)) return false;
    const importDecl = binding.path.parentPath?.node;
    return t.isImportDeclaration(importDecl) && importDecl.source.value === "dompurify";
}

/**
 * Narrow, structural recognizer — see this module's doc comment for exactly
 * what is and is not recognized, and why.
 */
function isNarrowDompurifySanitizeCall(node: t.Node, path: NodePath): boolean {
    if (!t.isCallExpression(node)) return false;
    const callee = node.callee;
    if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.object) && t.isIdentifier(callee.property) && callee.property.name === "sanitize") {
        if (callee.object.name === "DOMPurify") return true;
        return isVerifiedDompurifyImportBinding(path, callee.object.name);
    }
    if (t.isIdentifier(callee)) {
        return isVerifiedDompurifyImportBinding(path, callee.name);
    }
    return false;
}

interface Resolution {
    isStatic: boolean;
    effectiveNode: t.Node;
    tracedVia?: string;
}

/** Identical to xss.ts's resolveForXss — one-hop resolution is unrelated to sanitizer recognition. */
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

function makeFinding(ruleId: string, title: string, node: t.Node, code: string, resolution: Resolution, path: NodePath): Finding {
    const recognized = isNarrowDompurifySanitizeCall(resolution.effectiveNode, path);
    const traceNote = resolution.tracedVia ? ` (traced back one step to the declaration of \`${resolution.tracedVia}\`)` : "";
    return {
        ruleId,
        title,
        severity: recognized ? "low" : "high",
        category: "xss",
        message: recognized
            ? "A recognized DOMPurify sanitization call was found before this HTML sink. This may reduce risk, but review the sanitizer configuration and surrounding data flow. This result is not proof that the output is safe."
            : `${title}: the value assigned is not a static string literal${traceNote}, so it cannot be confirmed safe from this syntax alone.`,
        whyItMatters:
            "If the value ever includes attacker-influenced text (URL params, API responses, user-entered fields) and reaches this sink unescaped, it can execute arbitrary script in the page (DOM-based XSS). This rule cannot confirm the value is actually attacker-controlled — it flags the sink shape only.",
        saferExample: recognized
            ? "A structurally-verified DOMPurify.sanitize(...) call was found. Still confirm it is configured with an allowlist appropriate for your content, that its result isn't concatenated with additional unsanitized text, and that it isn't mutated afterward."
            : "Use `element.textContent = value` for plain text, or sanitize first: `element.innerHTML = DOMPurify.sanitize(value)`.",
        limitations:
            "[EXPERIMENTAL BUILD] Recognizes only a structurally-verified `DOMPurify.sanitize(...)` call (the literal `DOMPurify` identifier, or an import binding traced to the literal module \"dompurify\"), directly at the sink or one existing variable hop back. Does not resolve local aliases of the DOMPurify identifier itself, destructured sanitize bindings, extracted function references, cross-file wrappers, or any function's return value. Recognizing a call never proves the output is safe — it does not check the sanitizer's configuration, whether its result is later concatenated with unsanitized text, or whether it is mutated after sanitization.",
        location: locOf(node),
        snippet: excerptOf(code, node),
    };
}

export const experimentalXssRule: Rule = {
    id: "xss-sanitizer-recognition-experimental",
    category: "xss",
    title: "[EXPERIMENTAL] DOM XSS / unsafe HTML injection — narrow DOMPurify recognition",
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
                if (resolution.isStatic) return;
                findings.push(makeFinding(HTML_PROP_RULE_ID[propName], `Unsanitized assignment to .${propName}`, node, code, resolution, path));
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
                                findings.push(makeFinding("xss-insert-adjacent-html", "Unsanitized insertAdjacentHTML() call", node, code, resolution, path));
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
                                findings.push(makeJavascriptUriFinding("xss-setattribute-javascript-uri", `javascript: URI passed to setAttribute('${attrArg.value}', ...)`, node, code, jsUri.tracedVia));
                            }
                        }
                        return;
                    }
                    if (propName === "html" && isJquerySourced(path, callee.object)) {
                        const arg = node.arguments[0];
                        if (arg && t.isExpression(arg)) {
                            const resolution = resolveForXss(path, arg);
                            if (!resolution.isStatic) {
                                findings.push(makeFinding("xss-jquery-html", "Unsanitized jQuery .html() call", node, code, resolution, path));
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
                                    makeFinding(propName === "write" ? "xss-document-write" : "xss-document-writeln", `Unsanitized document.${propName}() call`, node, code, resolution, path),
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
                        findings.push(makeJavascriptUriFinding("xss-jsx-href-javascript-uri", `javascript: URI in JSX ${node.name.name} prop`, node, code, jsUri.tracedVia));
                    }
                    return;
                }
                if (!t.isJSXIdentifier(node.name) || node.name.name !== "dangerouslySetInnerHTML") return;
                if (!node.value || !t.isJSXExpressionContainer(node.value)) return;
                let expr = node.value.expression;
                if (t.isIdentifier(expr)) {
                    const resolved = resolveSingleAssignment(path, expr);
                    if (resolved.resolved && resolved.initNode && t.isObjectExpression(resolved.initNode)) {
                        expr = resolved.initNode;
                    }
                }
                if (!t.isObjectExpression(expr)) return;
                const htmlProp = expr.properties.find((p) => t.isObjectProperty(p) && !p.computed && t.isIdentifier(p.key) && p.key.name === "__html");
                if (!htmlProp || !t.isObjectProperty(htmlProp)) return;
                const value = htmlProp.value;
                if (!t.isExpression(value)) return;
                const resolution = resolveForXss(path, value);
                if (resolution.isStatic) return;
                findings.push(makeFinding("xss-dangerously-set-inner-html", "Unsanitized dangerouslySetInnerHTML", node, code, resolution, path));
            },
        });

        return findings;
    },
};
