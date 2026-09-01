import * as t from "@babel/types";
import { traverseAst, locOf, isStaticStringExpression, isSanitizerWrapped, excerptOf } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding } from "../types";

/**
 * Rule group A — DOM XSS / unsafe HTML injection.
 *
 * Detects, via direct AST relationships (no data-flow/taint tracking):
 *   - `x.innerHTML = expr` / `x.outerHTML = expr`
 *   - `x.insertAdjacentHTML(pos, expr)`
 *   - `document.write(expr)` / `document.writeln(expr)`
 *   - React `dangerouslySetInnerHTML={{ __html: expr }}`
 *
 * A finding is only raised when `expr` is not provably a static string
 * literal (see isStaticStringExpression). If `expr` is wrapped in a
 * recognized sanitizer call (DOMPurify.sanitize, sanitizeHtml, xss(...)),
 * severity is downgraded to "low" with an explicit caveat — this rule
 * cannot verify the sanitizer is configured correctly or that it is the
 * real library.
 *
 * Explicitly out of scope, by design: this rule never inspects JSX event
 * props (`onClick`, `onChange`, `onSubmit`, etc.). Those are React
 * synthetic event handlers, not raw HTML attributes, and are not part of
 * this rule's pattern set at all — there is no shared regex or AST
 * selector between "innerHTML-like sink" and "on* JSX prop" in this
 * module, so there is nothing here that could conflate the two.
 *
 * Limitations (always disclosed, never hidden):
 *   - No taint tracking: `const safe = "<b>x</b>"; el.innerHTML = safe;`
 *     is NOT flagged, because the sink's own expression is a plain
 *     identifier, not a literal or a call — this rule intentionally only
 *     judges the syntax at the sink, so it also can't tell that `safe`
 *     traces back to a literal. That is a false negative this rule accepts
 *     in exchange for not fabricating a taint graph it cannot verify.
 *   - Aliasing (`const el2 = el; el2.innerHTML = x`) is followed only one
 *     level for the receiver name via the member expression itself; a
 *     wrapper function that internally does the assignment is not tracked.
 *   - Sanitizer recognition is name-based, not semantic.
 */

const HTML_MEMBER_PROPS = new Set(["innerHTML", "outerHTML"]);

function memberPropName(node: t.Node): string | undefined {
    if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
        return node.property.name;
    }
    return undefined;
}

function makeFinding(
    ruleId: string,
    title: string,
    node: t.Node,
    code: string,
    dynamicExpr: t.Node,
): Finding {
    const sanitized = isSanitizerWrapped(dynamicExpr);
    return {
        ruleId,
        title,
        severity: sanitized ? "low" : "high",
        category: "xss",
        message: sanitized
            ? `${title}: the value passed appears to be wrapped in a sanitizer call, but this cannot be verified as safe — it only reduces likelihood.`
            : `${title}: the value assigned is not a static string literal, so it cannot be confirmed safe from this syntax alone.`,
        whyItMatters:
            "If the value ever includes attacker-influenced text (URL params, API responses, user-entered fields) and reaches this sink unescaped, it can execute arbitrary script in the page (DOM-based XSS). This rule cannot confirm the value is actually attacker-controlled — it flags the sink shape only.",
        saferExample: sanitized
            ? "Sanitizer detected. Confirm it is imported from a real, maintained library (e.g. `dompurify`) and configured with an allowlist appropriate for your content."
            : "Use `element.textContent = value` for plain text, or sanitize first: `element.innerHTML = DOMPurify.sanitize(value)`.",
        limitations:
            "Direct AST match only — no data-flow/taint analysis. A literal assigned to a variable first, then assigned to this sink, will not be flagged (false negative). A sanitizer name match does not verify safe configuration.",
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
                if (isStaticStringExpression(node.right)) return; // literal HTML — not flagged
                findings.push(
                    makeFinding(
                        propName === "innerHTML" ? "xss-inner-html" : "xss-outer-html",
                        `Unsanitized assignment to .${propName}`,
                        node,
                        code,
                        node.right,
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
                        if (t.isExpression(htmlArg) && !isStaticStringExpression(htmlArg)) {
                            findings.push(
                                makeFinding(
                                    "xss-insert-adjacent-html",
                                    "Unsanitized insertAdjacentHTML() call",
                                    node,
                                    code,
                                    htmlArg,
                                ),
                            );
                        }
                        return;
                    }
                    if ((propName === "write" || propName === "writeln") && t.isIdentifier(callee.object) && callee.object.name === "document") {
                        const arg = node.arguments[0];
                        if (arg && t.isExpression(arg) && !isStaticStringExpression(arg)) {
                            findings.push(
                                makeFinding(
                                    propName === "write" ? "xss-document-write" : "xss-document-writeln",
                                    `Unsanitized document.${propName}() call`,
                                    node,
                                    code,
                                    arg,
                                ),
                            );
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
                if (!t.isExpression(value) || isStaticStringExpression(value)) return;
                findings.push(
                    makeFinding(
                        "xss-dangerously-set-inner-html",
                        "Unsanitized dangerouslySetInnerHTML",
                        node,
                        code,
                        value,
                    ),
                );
            },
        });

        return findings;
    },
};
