import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { traverseAst, locOf, excerptOf, isStaticStringExpression, resolveSingleAssignment } from "../ast-utils";
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
 *   3. `auth-weak-password-hash`: a value named like a password run through
 *      a fast general-purpose hash (createHash("md5"/"sha1"/"sha256").update(),
 *      md5(), CryptoJS.SHA256()). Gated on the password-like NAME so ordinary
 *      checksums and cache keys aren't flagged.
 *
 *   4. `auth-insecure-random-token`: Math.random() used to build something
 *      named like a secret (token, otp, reset code, session id...). Judged by
 *      the nearest variable/assignment/property/function name only, so
 *      Math.random() for animation delays or shuffles isn't flagged.
 *
 *   5. `auth-jwt-literal-secret`: jwt.sign()/jwt.verify() given a string
 *      literal as the secret, directly or one variable hop back.
 *
 * All of these are whole-file or name-based heuristics, not data-flow
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

        // ---- Checks 3-5: password hashing, random tokens, JWT secrets --
        traverseAst(ast, {
            CallExpression(path) {
                const { node } = path;
                const callee = node.callee;

                // Check 3: a password-named value through a fast hash.
                const hashed = fastHashOfPassword(node);
                if (hashed) {
                    findings.push({
                        ruleId: "auth-weak-password-hash",
                        title: "Password hashed with a fast, general-purpose hash",
                        severity: "high",
                        category: "auth",
                        message: `"${hashed.name}" is hashed with ${hashed.algo}. That's a fast hash meant for checksums, not for storing passwords.`,
                        whyItMatters: "If the database ever leaks, fast hashes like MD5, SHA-1 and plain SHA-256 can be tried billions of times a second on a normal graphics card, and unsalted ones match precomputed tables instantly. Most real passwords fall in minutes.",
                        saferExample: "Use a password hashing function built to be slow: `const hash = await bcrypt.hash(password, 12)` and `await bcrypt.compare(password, hash)`, or argon2 / scrypt.",
                        limitations: "Name-based: only fires when the hashed value is named like a password (password, passwd, pwd, pass), directly or as a property. A password under another name is missed, and a non-password value with a password-like name is flagged. Does not check whether a salt or many iterations are added around the hash.",
                        location: locOf(node),
                        snippet: excerptOf(code, node),
                    });
                    return;
                }

                // Check 5: jwt.sign / jwt.verify with a secret written in the code.
                if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property) && t.isIdentifier(callee.object)
                    && JWT_OBJECT_NAMES.has(callee.object.name) && (callee.property.name === "sign" || callee.property.name === "verify")) {
                    const secretArg = node.arguments[1];
                    if (!secretArg || !t.isExpression(secretArg)) return;
                    let literal: t.Node | undefined = isStaticStringExpression(secretArg) ? secretArg : undefined;
                    let via: string | undefined;
                    if (!literal && t.isIdentifier(secretArg)) {
                        const r = resolveSingleAssignment(path, secretArg);
                        if (r.resolved && r.initNode && isStaticStringExpression(r.initNode)) {
                            literal = r.initNode;
                            via = secretArg.name;
                        }
                    }
                    if (!literal) return;
                    findings.push({
                        ruleId: "auth-jwt-literal-secret",
                        title: `jwt.${callee.property.name}() with a secret written in the code`,
                        severity: "high",
                        category: "auth",
                        message: `The JWT signing secret is a string written straight into the source${via ? ` (in \`${via}\`, one line up)` : ""}.`,
                        whyItMatters: "Anyone who can read the code (a public repo, a leaked zip, a shared screenshot) can sign their own tokens and log in as any user, including an admin. Secrets like \"secret\" or \"mysecret123\" are also among the first an attacker guesses.",
                        saferExample: "Load it from the environment and fail fast if it's missing: `const secret = process.env.JWT_SECRET; if (!secret) throw new Error(\"JWT_SECRET not set\"); jwt.sign(payload, secret, { expiresIn: \"1h\" })`.",
                        limitations: "Only recognises the call as jwt.sign/verify on an object named jwt, JWT or jsonwebtoken, and follows a variable back one step. A secret built from a literal in some other way, or passed through a config object, is missed.",
                        location: locOf(node),
                        snippet: excerptOf(code, node),
                    });
                    return;
                }

                // Check 4: Math.random() making something secret.
                if (isMathRandomCall(node)) {
                    const owner = secretNameOwning(path);
                    if (!owner) return;
                    findings.push({
                        ruleId: "auth-insecure-random-token",
                        title: "Math.random() used to make a secret value",
                        severity: "medium",
                        category: "auth",
                        message: `Math.random() is used to build "${owner}". Math.random() isn't meant for anything secret.`,
                        whyItMatters: "Math.random() is predictable: its output can be reconstructed from a handful of earlier values, and it has far less randomness than it looks. A reset link, login code or session id made with it can be guessed.",
                        saferExample: "Use the crypto module: `crypto.randomBytes(32).toString(\"hex\")` or `crypto.randomUUID()` in Node, `crypto.getRandomValues(...)` in the browser. For a 6-digit code: `crypto.randomInt(0, 1_000_000)`.",
                        limitations: "Name-based: only fires when the value goes into something named like a secret (token, secret, password, otp, nonce, salt, session id, reset, verification, api key, invite), as a variable, property, or the function that returns it. Math.random() used for harmless things (animations, shuffling a UI list) is left alone, and a secret under an unusual name is missed.",
                        location: locOf(node),
                        snippet: excerptOf(code, path.parentPath?.node ?? node),
                    });
                }
            },
        });

        return findings;
    },
};

// ---- helpers for checks 3-5 ---------------------------------------------

const FAST_HASHES = /^(md4|md5|sha1|sha-1|sha224|sha256|sha-256|sha384|sha512|sha-512|ripemd160)$/i;
const FAST_HASH_FUNCTIONS = new Set(["md5", "sha1", "sha256", "sha512", "MD5", "SHA1", "SHA256", "SHA512"]);
const JWT_OBJECT_NAMES = new Set(["jwt", "JWT", "jsonwebtoken"]);

/** Splits camelCase / snake_case / kebab-case into lowercase words: "resetToken" -> ["reset", "token"]. */
function wordsOf(name: string): string[] {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((w) => w.toLowerCase());
}

const PASSWORD_WORDS = new Set(["password", "passwd", "pwd", "pass", "passphrase"]);
function isPasswordName(name: string): boolean {
    return wordsOf(name).some((w) => PASSWORD_WORDS.has(w));
}

const SECRET_WORDS = new Set(["token", "secret", "password", "passwd", "otp", "nonce", "salt", "sid", "apikey", "invite", "passphrase"]);
const SECRET_PAIRS: [string, Set<string>][] = [
    ["session", new Set(["id", "key"])],
    ["reset", new Set(["token", "code", "link", "key"])],
    ["verification", new Set(["code", "token", "id"])],
    ["api", new Set(["key"])],
    ["auth", new Set(["code", "key"])],
];
/** Whole-word match, so "footprint" isn't an "otp" and "resetDelay" isn't a reset token. */
function isSecretName(name: string): boolean {
    const words = wordsOf(name);
    if (words.some((w) => SECRET_WORDS.has(w))) return true;
    return words.some((w, i) => SECRET_PAIRS.some(([first, seconds]) => w === first && seconds.has(words[i + 1] ?? "")));
}

function nameOf(node: t.Node): string | undefined {
    if (t.isIdentifier(node)) return node.name;
    if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) return node.property.name;
    return undefined;
}

/**
 * `crypto.createHash("md5").update(password)`, `md5(password)`,
 * `CryptoJS.SHA256(password)`, `sha1(user.password)`.
 */
function fastHashOfPassword(node: t.CallExpression): { name: string; algo: string } | null {
    const callee = node.callee;
    const arg = node.arguments[0];
    if (!arg || !t.isExpression(arg)) return null;
    const argName = nameOf(arg);
    if (!argName || !isPasswordName(argName)) return null;

    // .update(password) on a createHash(<fast>) chain
    if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property) && callee.property.name === "update") {
        let obj: t.Node = callee.object;
        while (t.isCallExpression(obj) && t.isMemberExpression(obj.callee) && !(t.isIdentifier(obj.callee.property) && obj.callee.property.name === "createHash")) {
            obj = obj.callee.object;
        }
        if (t.isCallExpression(obj) && t.isMemberExpression(obj.callee) && t.isIdentifier(obj.callee.property) && obj.callee.property.name === "createHash") {
            const algo = obj.arguments[0];
            if (t.isStringLiteral(algo) && FAST_HASHES.test(algo.value)) return { name: argName, algo: algo.value.toUpperCase() };
        }
        return null;
    }
    // md5(password) / CryptoJS.SHA256(password)
    const fn = t.isIdentifier(callee) ? callee.name : t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property) ? callee.property.name : undefined;
    if (fn && FAST_HASH_FUNCTIONS.has(fn)) return { name: argName, algo: fn.toUpperCase() };
    return null;
}

function isMathRandomCall(node: t.CallExpression): boolean {
    const c = node.callee;
    return t.isMemberExpression(c) && !c.computed && t.isIdentifier(c.object) && c.object.name === "Math" && t.isIdentifier(c.property) && c.property.name === "random";
}

/**
 * The secret-looking name this Math.random() call ends up in, if any:
 * walks up to the nearest variable, assignment, object property or
 * enclosing function and checks that one name. Stops at the first of those
 * it reaches, so `const delay = Math.random() * 1000` inside a function
 * called makeToken is judged by "delay", not by the function.
 */
function secretNameOwning(path: NodePath): string | undefined {
    let p: NodePath | null = path.parentPath;
    for (let depth = 0; p && depth < 12; depth++, p = p.parentPath) {
        const n = p.node;
        if (t.isVariableDeclarator(n)) {
            const name = t.isIdentifier(n.id) ? n.id.name : undefined;
            return name && isSecretName(name) ? name : undefined;
        }
        if (t.isAssignmentExpression(n)) {
            const name = nameOf(n.left);
            return name && isSecretName(name) ? name : undefined;
        }
        if (t.isObjectProperty(n)) {
            const name = t.isIdentifier(n.key) ? n.key.name : t.isStringLiteral(n.key) ? n.key.value : undefined;
            return name && isSecretName(name) ? name : undefined;
        }
        if (t.isFunctionDeclaration(n) || t.isFunctionExpression(n) || t.isArrowFunctionExpression(n)) {
            let name: string | undefined = t.isFunctionDeclaration(n) || t.isFunctionExpression(n) ? n.id?.name : undefined;
            if (!name && p.parentPath && t.isVariableDeclarator(p.parentPath.node) && t.isIdentifier(p.parentPath.node.id)) name = p.parentPath.node.id.name;
            return name && isSecretName(name) ? `${name}()` : undefined;
        }
    }
    return undefined;
}
