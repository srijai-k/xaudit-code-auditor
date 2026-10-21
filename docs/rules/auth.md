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

---

## auth-weak-password-hash

**What it flags:** a value named like a password (`password`, `passwd`, `pwd`, `pass`, `passphrase`, as a whole word in the name, so `userPassword` and `req.body.pass` count but `passport` and `bypass` don't) run through a fast general-purpose hash: `crypto.createHash("md5" | "sha1" | "sha256" | "sha512" | ...).update(password)`, `md5(password)`, `sha1(password)`, `CryptoJS.MD5(...)`/`CryptoJS.SHA256(...)`.

**Severity:** High. If the database leaks, fast hashes can be tried billions of times a second, and unsalted ones match precomputed tables.

**Risky example:**
```js
const hash = crypto.createHash("md5").update(password).digest("hex");
```

**Safe examples (not flagged):**
```js
const etag = crypto.createHash("md5").update(fileBuffer).digest("hex"); // a checksum, not a password
const hash = await bcrypt.hash(password, 12);                             // a slow password hash
```

**Limitations:** name-based: a password under another name is missed, and a non-password value with a password-like name is flagged. Doesn't check for a salt or many iterations around the hash.

**Tests:** `tests/fixtures/vulnerable/auth-md5-password-hash.ts`, `auth-sha256-user-password.ts` · safe: `tests/fixtures/safe/auth-md5-file-checksum-safe.ts`, `auth-bcrypt-hash-safe.ts`

---

## auth-insecure-random-token

**What it flags:** `Math.random()` used to build something named like a secret: token, secret, password, otp, nonce, salt, sid, api key, invite, session id/key, reset token/code/link, verification code/token, auth code. The name is judged as whole words (camelCase and snake_case are split), from the nearest variable, assignment target, object property, or the function that returns it.

**Severity:** Medium. `Math.random()` is predictable, so a reset link, login code or session id built with it can be guessed.

**Risky examples:**
```js
const resetToken = Math.random().toString(36).slice(2);
function generateOtp() { return Math.floor(Math.random() * 1000000); }
```

**Safe examples (not flagged):**
```js
const resetDelay = Math.random() * 1000;   // "reset" alone isn't a secret
const footprint = Math.random();           // whole-word match: not an "otp"
items.sort(() => Math.random() - 0.5);     // a shuffle
```
Only the nearest name counts, so `const jitter = Math.random()` inside a function called `makeToken` is judged by "jitter".

**Limitations:** name-based: a secret under an unusual name is missed. Doesn't follow the value after it's made.

**Tests:** `tests/fixtures/vulnerable/auth-math-random-reset-token.ts`, `auth-math-random-otp-function.ts` · safe: `tests/fixtures/safe/auth-math-random-ui-safe.ts`

---

## auth-jwt-literal-secret

**What it flags:** `jwt.sign(payload, secret)` or `jwt.verify(token, secret)` (on an object named `jwt`, `JWT` or `jsonwebtoken`) where the secret is a string literal, directly or one never-reassigned variable back.

**Severity:** High. Anyone who can read the code can sign their own tokens and log in as any user.

**Risky example:**
```js
const token = jwt.sign({ id: user.id, role: user.role }, "mysecret123", { expiresIn: "7d" });
```

**Safe example (not flagged):**
```js
const secret = process.env.JWT_SECRET;
const token = jwt.sign({ id: user.id }, secret, { expiresIn: "1h" });
```

**Limitations:** only recognises the call on an object named jwt/JWT/jsonwebtoken, and follows one variable hop. A secret passed through a config object or built some other way is missed. When the literal sits in a variable named like a secret, `secret-generic-assignment` may also fire on that line.

**Tests:** `tests/fixtures/vulnerable/auth-jwt-sign-literal-secret.ts` · safe: `tests/fixtures/safe/auth-jwt-env-secret-safe.ts`


---

## auth-predictable-token

**What it flags:** a value named like a secret (token, otp, reset code, session id...) built from the clock (`Date.now()`, `new Date()`, `.getTime()`, `performance.now()`, `process.hrtime()`), usually together with an id, with no random part at all.

**Severity:** High. A timestamp has only so many possible values, and ids are guessable, so a reset token like this can be worked out and used to take over an account.

**Risky example:**
```js
const token = "reset-" + account.id + "-" + Date.now();
```

**Safe examples (not flagged):**
```js
const tokenExpiresAt = Date.now() + 3600 * 1000;                         // a time ABOUT a token
const token = crypto.randomBytes(16).toString("hex") + "-" + Date.now(); // has real randomness
```
Names that describe a time (`...ExpiresAt`, `...CreatedAt`, `...Ttl`) are skipped on purpose.

**Limitations:** name-based, like the other auth checks. Any crypto/uuid/nanoid/Math.random call in the value counts as "random" (Math.random is reported separately by `auth-insecure-random-token`). A predictable value that doesn't use the clock (a counter, a hash of the email) is missed.

**Tests:** `tests/fixtures/vulnerable/auth-reset-token-from-time.ts`, `tests/fixtures/vulnerable/express-workspace-service-audit.ts` · safe: `tests/fixtures/safe/auth-time-about-a-token-safe.ts`
