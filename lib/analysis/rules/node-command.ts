import * as t from "@babel/types";
import { traverseAst, locOf, isStaticStringExpression, excerptOf } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding } from "../types";

/**
 * Rule group E — Node.js command-injection patterns (optional / limited).
 *
 * Labelled explicitly as "Node.js patterns", not "full Node security
 * analysis" — this rule parses JS/TS syntax (it does not run in Node, it
 * does not resolve `require`/`import` bindings), and only recognizes
 * `exec` / `execSync` / `spawn` by identifier or `object.method` name.
 *
 * Flags:
 *   - `exec(expr)` / `execSync(expr)` where `expr` is not a static string.
 *   - `spawn(cmd, args, { shell: true })` where `cmd` or any element of
 *     `args` is not a static string.
 *
 * Does NOT flag:
 *   - `execFile("git", ["status"])` — a different, safer API not covered by
 *     this rule at all.
 *   - Fixed command invocations with entirely static string arguments.
 *
 * Limitations: name-based only. If `exec` is imported under a different
 * local name (`import { exec as run } from "child_process"`) this rule does
 * not resolve that binding and will miss it (false negative, disclosed).
 */

function isExecLikeCallee(callee: t.Node, names: string[]): boolean {
    if (t.isIdentifier(callee)) return names.includes(callee.name);
    if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property)) {
        return names.includes(callee.property.name);
    }
    return false;
}

export const nodeCommandRule: Rule = {
    id: "node-command",
    category: "node-command",
    title: "Node.js command-injection pattern",
    run(ctx: RuleContext): Finding[] {
        const findings: Finding[] = [];
        const { ast, code } = ctx;

        traverseAst(ast, {
            CallExpression(path) {
                const { node } = path;
                const callee = node.callee;

                if (isExecLikeCallee(callee, ["exec", "execSync"])) {
                    const arg = node.arguments[0];
                    if (arg && t.isExpression(arg) && !isStaticStringExpression(arg)) {
                        findings.push({
                            ruleId: "node-command-exec-dynamic",
                            title: "Dynamic command passed to exec()/execSync()",
                            severity: "high",
                            category: "node-command",
                            message: "The command string passed to exec()/execSync() is not a static literal.",
                            whyItMatters:
                                "exec()/execSync() run the string through a shell. If any part of it is attacker-influenced, this allows arbitrary command execution (Node.js pattern only — this rule does not analyze other runtimes).",
                            saferExample:
                                "Prefer execFile(command, argsArray) with a fixed command and an array of arguments — it does not invoke a shell, so argument injection via shell metacharacters is not possible.",
                            limitations:
                                "Name-based match on `exec`/`execSync` identifiers or `object.exec` member calls only; does not resolve import aliases or verify the argument is actually attacker-controlled.",
                            location: locOf(node),
                            snippet: excerptOf(code, node),
                        });
                    }
                    return;
                }

                if (isExecLikeCallee(callee, ["spawn"])) {
                    const [cmdArg, argsArg, optsArg] = node.arguments;
                    if (!optsArg || !t.isExpression(optsArg) || !t.isObjectExpression(optsArg)) return;
                    const shellProp = optsArg.properties.find(
                        (p): p is t.ObjectProperty =>
                            t.isObjectProperty(p) && !p.computed && t.isIdentifier(p.key) && p.key.name === "shell",
                    );
                    if (!shellProp || !t.isBooleanLiteral(shellProp.value) || shellProp.value.value !== true) return;

                    const cmdIsDynamic = cmdArg && t.isExpression(cmdArg) && !isStaticStringExpression(cmdArg);
                    let argsAreDynamic = false;
                    if (argsArg && t.isArrayExpression(argsArg)) {
                        argsAreDynamic = argsArg.elements.some(
                            (el) => el && t.isExpression(el) && !isStaticStringExpression(el),
                        );
                    } else if (argsArg && t.isExpression(argsArg)) {
                        argsAreDynamic = true; // args isn't even a literal array — can't verify it's static
                    }

                    if (cmdIsDynamic || argsAreDynamic) {
                        findings.push({
                            ruleId: "node-command-spawn-shell",
                            title: "spawn() with shell: true and non-static command/args",
                            severity: "high",
                            category: "node-command",
                            message: "spawn() is called with { shell: true } and the command or its arguments are not fully static literals.",
                            whyItMatters:
                                "With shell: true, spawn() invokes a shell, so shell metacharacters in a non-static command or argument can change what actually executes.",
                            saferExample:
                                "Remove { shell: true } and call spawn(command, argsArray) directly, or use execFile with fixed arguments.",
                            limitations:
                                "Name-based match on a literal `spawn(...)` call with an inline options object only; does not track option objects built elsewhere and passed in by reference.",
                            location: locOf(node),
                            snippet: excerptOf(code, node),
                        });
                    }
                }
            },
        });

        return findings;
    },
};
