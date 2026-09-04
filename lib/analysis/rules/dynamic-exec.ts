import * as t from "@babel/types";
import { traverseAst, locOf, excerptOf } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding, Severity } from "../types";

/**
 * Rule group B — dangerous dynamic execution.
 *
 * Detects: eval(...), new Function(...)/Function(...), and
 * setTimeout/setInterval called with a string (or string-concatenation)
 * first argument instead of a function reference.
 *
 * All findings are "high" severity by default, never "critical" — this
 * rule cannot establish that the argument is attacker-controlled, only
 * that a dynamic-execution API was used. A fixed string literal is still
 * flagged (these APIs are error-prone and hard to audit even with
 * constant input), but the message says so plainly instead of implying
 * an exploit exists.
 *
 * A non-literal import()/require() specifier was tried and removed (see
 * docs/model-improvements.md, "Reverted: dynamic import()/require()
 * check") — it fired "high" on the standard, extremely common
 * code-splitting-by-route/locale idiom (`import(\`./pages/${page}.jsx\`)`),
 * which is structurally indistinguishable via AST shape alone from an
 * actually dangerous computed specifier. Unlike innerHTML/db.query, where
 * a `+`/`${}` at the sink is a strong signal, "a computed module path" is
 * itself completely normal software engineering, so this never cleared
 * the noise bar the rest of this rule set holds itself to.
 */

function isStringCodeArg(node: t.Node): boolean {
    if (t.isStringLiteral(node) || t.isTemplateLiteral(node)) return true;
    if (t.isBinaryExpression(node) && node.operator === "+") {
        return isStringCodeArg(node.left) || (t.isExpression(node.right) && isStringCodeArg(node.right));
    }
    return false;
}

function isCalleeNamed(callee: t.Node, name: string): boolean {
    return t.isIdentifier(callee) && callee.name === name;
}

function severityAndNote(argIsLiteral: boolean): { severity: Severity; note: string } {
    return argIsLiteral
        ? {
              severity: "high",
              note: "The argument is a fixed string literal in this snippet, so there is no attacker-controlled input visible here. It is still flagged because eval()/Function()/string-timers are inherently hard to audit and easy to make unsafe with a future edit.",
          }
        : {
              severity: "high",
              note: "The argument is not a fixed literal. This rule cannot confirm whether it originates from attacker-controlled input — only that dynamic code execution is used here.",
          };
}

function makeFinding(ruleId: string, title: string, node: t.Node, code: string, argNode: t.Node | undefined, saferExample: string): Finding {
    const literal = argNode ? isStringCodeArg(argNode) && (t.isStringLiteral(argNode) || (t.isTemplateLiteral(argNode) && argNode.expressions.length === 0)) : false;
    const { severity, note } = severityAndNote(literal);
    return {
        ruleId,
        title,
        severity,
        category: "dynamic-exec",
        message: `${title}. ${note}`,
        whyItMatters:
            "Executing a string as code bypasses the parser's ability to statically reason about it and, if the string ever contains attacker-influenced content, allows arbitrary code execution in this context.",
        saferExample,
        limitations:
            "Direct AST match only. This rule flags the call shape, not exploitability — it cannot trace whether the argument value is attacker-controlled.",
        location: locOf(node),
        snippet: excerptOf(code, node),
    };
}

export const dynamicExecRule: Rule = {
    id: "dynamic-exec",
    category: "dynamic-exec",
    title: "Dangerous dynamic execution",
    run(ctx: RuleContext): Finding[] {
        const findings: Finding[] = [];
        const { ast, code } = ctx;

        traverseAst(ast, {
            CallExpression(path) {
                const { node } = path;
                const callee = node.callee;

                if (isCalleeNamed(callee, "eval")) {
                    findings.push(
                        makeFinding(
                            "exec-eval",
                            "Use of eval()",
                            node,
                            code,
                            node.arguments[0] as t.Node | undefined,
                            "Avoid eval(). Use JSON.parse() for data, or restructure logic to avoid executing dynamic strings.",
                        ),
                    );
                    return;
                }

                if (isCalleeNamed(callee, "Function")) {
                    findings.push(
                        makeFinding(
                            "exec-function-ctor",
                            "Use of Function() constructor",
                            node,
                            code,
                            node.arguments[node.arguments.length - 1] as t.Node | undefined,
                            "Avoid the Function constructor. Define named functions ahead of time instead of building them from strings.",
                        ),
                    );
                    return;
                }

                if ((isCalleeNamed(callee, "setTimeout") || isCalleeNamed(callee, "setInterval")) && node.arguments.length > 0) {
                    const fnArg = node.arguments[0];
                    if (t.isExpression(fnArg) && isStringCodeArg(fnArg)) {
                        const isInterval = isCalleeNamed(callee, "setInterval");
                        findings.push(
                            makeFinding(
                                isInterval ? "exec-set-interval-string" : "exec-set-timeout-string",
                                `${isInterval ? "setInterval" : "setTimeout"} called with a string body`,
                                node,
                                code,
                                fnArg,
                                `Pass a function reference instead: ${isInterval ? "setInterval" : "setTimeout"}(() => { ... }, delay).`,
                            ),
                        );
                    }
                }
            },
            NewExpression(path) {
                const { node } = path;
                if (isCalleeNamed(node.callee, "Function")) {
                    findings.push(
                        makeFinding(
                            "exec-function-ctor",
                            "Use of new Function() constructor",
                            node,
                            code,
                            node.arguments[node.arguments.length - 1] as t.Node | undefined,
                            "Avoid the Function constructor. Define named functions ahead of time instead of building them from strings.",
                        ),
                    );
                }
            },
        });

        return findings;
    },
};
