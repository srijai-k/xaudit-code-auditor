# Weak authentication patterns — `auth.ts`

Source: [`src/lib/analysis/rules/auth.ts`](../../src/lib/analysis/rules/auth.ts) · Tests: [`tests/rules/auth.test.ts`](../../tests/rules/auth.test.ts) · Category: `auth`

**Not** general authentication/session-management analysis — no cookie/CSRF-token handling, no login-flow analysis. Two specific, deliberately narrow checks, each scoped the way it is because of a real false-positive risk this vulnerability class is unusually prone to (see each check's own reasoning below).

---

## auth-hardcoded-credential-comparison

**What it flags:** A credential-shaped name (`password`/`passwd`/`pwd`/`username`/`user_name`/`api[_-]?key`/`secret`/`token`, checked on an identifier or member-expression property) compared with `===`/`==`/`!==`/`!=` directly against a non-trivial string literal.

**Why this shape, specifically:** it turns out to structurally exclude the single biggest false-positive source for free. Jest/Vitest's `expect(x).toBe(y)` is a **CallExpression**, never a `BinaryExpression` — so the most common "password compared to a literal" pattern in any real codebase (test assertions) is never even examined, not via a naming heuristic, but because of the AST shape itself. The check also looks at the NAME being compared, never the literal's content — `grantType === "password"` (an OAuth2 grant-type check) isn't flagged, because "grantType" isn't a credential-shaped name, even though the literal value is the word "password."

**Excluded literal values** (not flagged even against a credential-shaped name): empty string, and the auth-scheme-adjacent words `bearer`/`basic`/`digest`/`none`/`null`/`undefined`/`true`/`false`.

**Severity:** Medium — a name/shape heuristic, not a sink-based signal.

**Risky examples:**
```js
if (req.body.password === "admin123") { return grantAccess(); }
function checkApiKey(apiKey) { return apiKey === "sk-hardcoded-secret-key-12345"; }
```

**Safe examples:**
```js
user.password === hashedInput;              // compared to a variable, not a literal — the normal, correct shape
user.role === "admin";                       // 'role' is not a credential-shaped name
grantType === "password";                    // OAuth2 grant type — checks the NAME, not the literal's content
password === "";                              // empty-check — excluded explicitly
tokenType === "Bearer";                       // 'Bearer' is a scheme name, not a secret value — excluded
expect(user.password).toBe("test123");        // a CallExpression, not a === comparison — never examined
bcrypt.compare(password, storedHash);         // real hashing-library usage — a CallExpression
```

**Limitations:** Name-based heuristic — can miss a credential comparison under an unconventional name, and can occasionally flag a genuinely debatable case (a UI field literally named `password` compared against a known placeholder string). Does not verify whether the code path is reachable, or whether the literal is a real production credential vs. a fixture value.

**Tests:** `tests/fixtures/vulnerable/auth-hardcoded-password-comparison.ts`, `auth-hardcoded-apikey-comparison.ts` · `tests/fixtures/safe/auth-password-compared-to-hash-variable.ts`, `auth-role-compared-to-literal-not-credential.ts`, `auth-oauth-grant-type-password.ts`, `auth-empty-password-check.ts`, `auth-tokentype-bearer-scheme.ts`, `auth-test-assertion-not-flagged.ts`, `auth-bcrypt-compare-used.ts` · `tests/independent-benchmark/samples/auth-middleware.js`

---

## auth-jwt-decode-without-verify

**What it flags:** `jwt.decode(token)` called somewhere in a file that also contains the literal string `"jsonwebtoken"` (an import/require reference — text-gated, not AST-resolved), where `jwt.verify(...)` is **never** called anywhere in that same file. `.decode()` does not check a token's signature; it happily returns whatever claims are in the payload even for a completely forged token.

**Severity:** Medium — a whole-file heuristic, weaker than a direct sink-based signal.

**Risky example:**
```js
import jwt from 'jsonwebtoken';
function getUserId(token) {
  const decoded = jwt.decode(token);   // signature never checked anywhere in this file
  return decoded.userId;
}
```

**Safe examples:**
```js
// verify() elsewhere in the SAME file suppresses the flag entirely:
import jwt from 'jsonwebtoken';
function authenticate(token) { return jwt.verify(token, process.env.JWT_SECRET); }
function peekClaims(token) { return jwt.decode(token); }   // NOT flagged — verify() exists in this file

// no "jsonwebtoken" reference at all — a .decode() on an unrelated object:
function decodeMessage(encoder, value) { return encoder.decode(value); }   // NOT flagged
```

**Limitations:** Whole-file, not cross-file — if verification genuinely happens in a *different* file or service (a realistic microservices pattern: an API gateway verifies, a downstream service just reads already-trusted claims), this will still flag it as a false positive, because this engine has no cross-file or cross-service awareness at all. See `tests/independent-benchmark/samples/legacy-token-reader.js` for a realistic example of this exact, disclosed limitation.

**Tests:** `tests/fixtures/vulnerable/auth-jwt-decode-no-verify.ts` · `tests/fixtures/safe/auth-jwt-verify-used.ts`, `auth-unrelated-decode-not-jwt.ts` · `tests/independent-benchmark/samples/jwt-session.js`, `legacy-token-reader.js`
