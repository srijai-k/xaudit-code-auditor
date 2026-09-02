import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { traverseAst, locOf, resolveSingleAssignment, excerptOf } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding } from "../types";

/**
 * Rule group C — narrow, honest SQL-injection heuristic.
 *
 * This is intentionally NOT a general SQL injection detector. It flags one
 * specific, well-defined shape: string concatenation (`+`) or template-
 * literal interpolation (`${...}`) passed to a recognized query-execution
 * method (`.query`, `.execute`, `.raw`, `.unsafe`) — either directly at the
 * call site, or one variable hop back (see ast-utils.ts's
 * resolveSingleAssignment). That one-hop trace is new and closes the
 * headline gap this rule shipped with: `const q = "..." + id; db.query(q)`
 * used to be invisible (the call site's argument is a plain identifier,
 * not a concatenation) — it's now traced back to its declaration and
 * caught, as long as that declaration is a single, never-reassigned
 * `const`/`let` in the same function.
 *
 * Still explicitly NOT interprocedural or cross-function data-flow — a
 * value built dynamically two functions away, reassigned after
 * declaration, or passed through a second variable, will NOT be caught
 * (false negative, disclosed, not hidden).
 *
 * `.query` is additionally gated on the receiver name looking like a
 * database handle (db/client/connection/pool/conn/sql, case-insensitive, or
 * a member access ending in one of those names) to avoid flagging unrelated
 * `.query()` methods on unrelated objects. `.execute`/`.raw`/`.unsafe` are
 * flagged regardless of receiver name, per the specified scope.
 */

const QUALIFIED_QUERY_RECEIVER = /^(db|client|connection|conn|pool|sql)$/i;
const UNQUALIFIED_METHODS = new Set(["execute", "raw", "unsafe"]);

function isDynamicSqlArg(node: t.Node): boolean {
    if (t.isTemplateLiteral(node)) return node.expressions.length > 0;
    // A `+` concatenation as the query argument means the query text is
    // being built at runtime rather than passed as one static literal —
    // flagged regardless of what the operands are, since this function is
    // only ever called on a query-method's first argument (or a value
    // traced back to it).
    if (t.isBinaryExpression(node) && node.operator === "+") return true;
    return false;
}

/**
 * Resolves whether the query argument is dynamic SQL, trying one variable
 * hop if it's a bare identifier. Unlike the XSS rule, an *unresolved*
 * identifier here stays unflagged by design: `db.query(preparedQuery, [id])`
 * — a variable holding a parameterized query string — is the normal, safe,
 * extremely common pattern, and flagging every unresolved identifier passed
 * to `.query()` would make this rule mostly noise.
 */
function resolveForSqli(path: NodePath, node: t.Node): { isDynamic: boolean; tracedVia?: string } {
    if (isDynamicSqlArg(node)) return { isDynamic: true };
    if (t.isIdentifier(node)) {
        const resolved = resolveSingleAssignment(path, node);
        if (resolved.resolved && resolved.initNode && isDynamicSqlArg(resolved.initNode)) {
            return { isDynamic: true, tracedVia: node.name };
        }
    }
    return { isDynamic: false };
}

function receiverLooksLikeDb(objectNode: t.Node): boolean {
    if (t.isIdentifier(objectNode)) return QUALIFIED_QUERY_RECEIVER.test(objectNode.name);
    if (t.isMemberExpression(objectNode) && !objectNode.computed && t.isIdentifier(objectNode.property)) {
        return QUALIFIED_QUERY_RECEIVER.test(objectNode.property.name);
    }
    return false;
}

export const sqliRule: Rule = {
    id: "sqli",
    category: "sqli",
    title: "Possible SQL injection: dynamic SQL passed to a recognized query API",
    run(ctx: RuleContext): Finding[] {
        const findings: Finding[] = [];
        const { ast, code } = ctx;

        traverseAst(ast, {
            CallExpression(path) {
                const { node } = path;
                const callee = node.callee;
                if (!t.isMemberExpression(callee) || callee.computed || !t.isIdentifier(callee.property)) return;
                const methodName = callee.property.name;

                const isQualified = methodName === "query" && receiverLooksLikeDb(callee.object);
                const isUnqualified = UNQUALIFIED_METHODS.has(methodName);
                if (!isQualified && !isUnqualified) return;

                const arg = node.arguments[0];
                if (!arg || !t.isExpression(arg)) return;
                const resolution = resolveForSqli(path, arg);
                if (!resolution.isDynamic) return; // plain literal or unresolved identifier — not flagged

                const traceNote = resolution.tracedVia
                    ? ` (traced back one step to the declaration of \`${resolution.tracedVia}\`)`
                    : "";

                findings.push({
                    ruleId: "sqli-dynamic-query",
                    title: "Possible SQL injection",
                    severity: "high",
                    category: "sqli",
                    message: `Dynamic SQL (string concatenation or template interpolation) reaches .${methodName}()${traceNote}. This is a recognized query-execution API call shape, not a confirmed exploit.`,
                    whyItMatters:
                        "If any part of the interpolated/concatenated value originates from user input, this allows SQL injection: an attacker can alter the query's structure. This rule cannot confirm the value is user-controlled.",
                    saferExample:
                        "Use parameterized queries: db.query(\"SELECT * FROM users WHERE id = $1\", [id]) or an ORM/query builder call (e.g. prisma.user.findUnique({ where: { id } })).",
                    limitations:
                        "Detects concatenation/interpolation at the call site for .query/.execute/.raw/.unsafe, or one variable hop back to a never-reassigned declaration. Does not perform interprocedural taint analysis — a value assembled in a different function, or passed through a second variable, is not tracked. Does not detect SQL injection in ORMs' raw-query escape hatches beyond the method names listed, nor in non-JS/TS backends.",
                    location: locOf(node),
                    snippet: excerptOf(code, node),
                });
            },
        });

        return findings;
    },
};
