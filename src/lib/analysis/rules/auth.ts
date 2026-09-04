import * as t from "@babel/types";
import { traverseAst, locOf, excerptOf } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding } from "../types";

/**
 * Rule group F — weak authentication patterns (narrow, new).
 *
 * This is NOT general authentication/session-management analysis — that
 * remains out of scope (see README's "Unsupported vulnerability classes").
 * It is two specific, deliberately narrow checks, each scoped the way it
 * is because of a real false-positive risk this vulnerability class is
 * unusually prone to (a lesson already paid for once this session with
 * the reverted import()/require() check — applied here from the start
 * instead of learned the hard way again):
 *
 *   1. `auth-hardcoded-credential-comparison`: a credential-shaped name
 *      (password/username/token/secret/apiKey) compared with `===`/`==`/
 *      `!==`/`!=` directly against a string literal. This shape is
 *      structurally almost impossible to produce with a real hashing
 *      library — bcrypt/argon2/scrypt all expose an async or sync
 *      COMPARE FUNCTION (`bcrypt.compare(plain, hash)`), never a `===`
 *      you'd write yourself, and test-assertion libraries (Jest/Vitest's
 *      `expect(x).toBe(y)`) are CallExpressions, not BinaryExpressions —
 *      so the single most obvious false-positive source (test files
 *      asserting on a password field) is excluded by AST shape alone,
 *      not by guessing at file names, which this engine never sees.
 *      Deliberately checks the NAME being compared, never the literal's
 *      CONTENT — `if (fieldType === "password")` (checking an HTML input
 *      type, or an OAuth `grant_type=password`) is not flagged, because
 *      "fieldType"/"grantType" don't match the credential-name pattern;
 *      only `if (password === "...")`-shaped code is.
 *
 *   2. `auth-jwt-decode-without-verify`: `jwt.decode()` is called
 *      somewhere in a file that imports/requires `jsonwebtoken`, and
 *      `jwt.verify()` is never called anywhere in that same file.
 *      `.decode()` does NOT check the token's signature — it happily
 *      returns whatever claims are in the payload even for a completely
 *      forged token. Gated on the literal string "jsonwebtoken" actually
 *      appearing in the source (not just any object with a `.decode()`
 *      method) specifically to avoid flagging an unrelated decode() call
 *      (base64, JSON, a custom codec) that has nothing to do with JWTs.
 *
 * Both checks are whole-file or name-based heuristics, not data-flow
 * analysis — see each finding's own `limitations` field for exactly what
 * that means in practice.
 */

const CREDENTIAL_NAME_PATTERN = /(password|passwd|pwd|username|user[_-]?name|api[_-]?key|secret|token)/i;
const NON_SECRET_LITERAL_VALUES = /^(bearer|basic|digest|none|null|undefined|true|false)$/i;
const COMPARISON_OPERATORS = new Set(["===", "==", "!==", "!="]);

function credentialNameOf(node: t.Node): string | undefined {
    if (t.isIdentifier(node) && CREDENTIAL_NAME_PATTERN.test(node.name)) return node.name;
    if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property) && CREDENTIAL_NAME_PATTERN.test(node.property.name)) {
        return node.property.name;
    }
    return undefined;
}

function isFlaggableLiteral(node: t.Node): node is t.StringLiteral {
    if (!t.isStringLiteral(node)) return false;
    if (node.value.length === 0) return false; // `password === ""` is a normal empty-check, not a backdoor
    if (NON_SECRET_LITERAL_VALUES.test(node.value)) return false; // auth-scheme names, sentinel-ish values
    return true;
}

function memberOrIdentifierName(node: t.Node): string {
    if (t.isIdentifier(node)) return node.name;
    if (t.isMemberExpression(node) && t.isIdentifier(node.property)) return node.property.name;
    return "value";
}

export const authRule: Rule = {
    id: "auth",
    category: "auth",
    title: "Weak authentication patterns",
    run(ctx: RuleContext): Finding[] {
        const findings: Finding[] = [];
        const { ast, code } = ctx;

        // ---- Check 1: hardcoded-credential comparison ----------------
        traverseAst(ast, {
            BinaryExpression(path) {
                const { node } = path;
                if (!COMPARISON_OPERATORS.has(node.operator)) return;

                const leftName = credentialNameOf(node.left);
                const rightName = t.isExpression(node.right) ? credentialNameOf(node.right) : undefined;
                const literalSide = t.isStringLiteral(node.left) ? node.left : t.isExpression(node.right) && t.isStringLiteral(node.right) ? node.right : undefined;
                const nameSide = leftName ? node.left : rightName && t.isExpression(node.right) ? node.right : undefined;
                const name = leftName ?? rightName;

                if (!name || !nameSide || !literalSide || !isFlaggableLiteral(literalSide)) return;
                // The name-bearing side and the literal must be different
                // sides of the operator (guards the degenerate `"x" === "x"` case).
                if (nameSide === literalSide) return;

                findings.push({
                    ruleId: "auth-hardcoded-credential-comparison",
                    title: "Hardcoded credential comparison",
                    severity: "medium",
                    category: "auth",
                    message: `"${memberOrIdentifierName(nameSide)}" is compared directly against a fixed string literal using ${node.operator}. Real credential/token verification never looks like this — hashing libraries (bcrypt, argon2, scrypt) expose a compare function, never a direct equality check against a literal.`,
                    whyItMatters: "A direct comparison against a hardcoded string is either a backdoor/debug credential left in by mistake, or a sign that passwords/tokens are being stored and checked in plaintext rather than hashed. This is a name-based heuristic — it flags the comparison SHAPE, not a confirmed vulnerability, and cannot see whether this code path is actually reachable in production.",
                    saferExample: "For passwords: bcrypt.compare(providedPassword, storedHash) (or argon2.verify). For tokens/API keys: compare against a value loaded from configuration/environment, never a literal baked into source, and prefer a constant-time comparison (crypto.timingSafeEqual) over ===.",
                    limitations: "Name-based heuristic (checks whether the compared identifier/property name looks credential-shaped, not its actual role) — can miss a credential comparison under an unconventional name, and can occasionally flag a genuinely benign comparison this engine can't tell apart from a real one (e.g. a UI field literally named 'password' compared against a known placeholder string). Does not verify whether this code path is reachable, or whether the literal is really a production credential vs. a fixture/example value.",
                    location: locOf(node),
                    snippet: excerptOf(code, node),
                });
            },
        });

        // ---- Check 2: jwt.decode() with no jwt.verify() anywhere ------
        if (code.includes("jsonwebtoken")) {
            let hasVerifyCall = false;
            const decodeCalls: t.CallExpression[] = [];

            traverseAst(ast, {
                CallExpression(path) {
                    const { node } = path;
                    const callee = node.callee;
                    if (!t.isMemberExpression(callee) || callee.computed || !t.isIdentifier(callee.property)) return;
                    if (callee.property.name === "verify") hasVerifyCall = true;
                    else if (callee.property.name === "decode") decodeCalls.push(node);
                },
            });

            if (!hasVerifyCall) {
                for (const node of decodeCalls) {
                    findings.push({
                        ruleId: "auth-jwt-decode-without-verify",
                        title: "jwt.decode() used with no jwt.verify() anywhere in this file",
                        severity: "medium",
                        category: "auth",
                        message: "jsonwebtoken's decode() reads a token's claims WITHOUT checking its signature — it will happily decode a completely forged or tampered token. No call to verify() was found anywhere else in this file.",
                        whyItMatters: "If the decoded claims are used for any authorization decision (checking a role, a user ID, an expiry), an attacker can forge a token with arbitrary claims and this code will trust it, since the signature is never checked.",
                        saferExample: "const decoded = jwt.verify(token, secretOrPublicKey); — verify() throws on an invalid/expired/tampered signature; decode() never does.",
                        limitations: "Whole-file heuristic: if verify() happens in a different file (e.g. authentication middleware verifies the token before this file only reads already-trusted claims from it), this will still flag it as a false positive — this engine does not track data across files or trust boundaries. Also flags decode() used only for non-authoritative purposes (logging, debugging) identically to an actual authorization use, since it cannot tell the two apart from syntax alone.",
                        location: locOf(node),
                        snippet: excerptOf(code, node),
                    });
                }
            }
        }

        return findings;
    },
};
