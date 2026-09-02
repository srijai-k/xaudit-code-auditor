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
 *   - `x.insertAdjacentHTML(pos, expr)`
 *   - `document.write(expr)` / `document.writeln(expr)`
 *   - React `dangerouslySetInnerHTML={{ __html: expr }}`
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

const HTML_MEMBER_PROPS = new Set(["innerHTML", "outerHTML"]);

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
            "Direct AST match plus one same-scope variable hop — not full data-flow/taint analysis. A value traced through two or more variables, or assembled in a different function, will not be resolved (false negative). A sanitizer name match does not verify safe configuration.",
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
                const propName = memberPropName(node.left);
                if (!propName || !HTML_MEMBER_PROPS.has(propName)) return;
                const resolution = resolveForXss(path, node.right);
                if (resolution.isStatic) return; // literal HTML, directly or traced — not flagged
                findings.push(
                    makeFinding(
                        propName === "innerHTML" ? "xss-inner-html" : "xss-outer-html",
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
                if (!t.isJSXIdentifier(node.name) || node.name.name !== "dangerouslySetInnerHTML") return;
                if (!node.value || !t.isJSXExpressionContainer(node.value)) return;
                const expr = node.value.expression;
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
