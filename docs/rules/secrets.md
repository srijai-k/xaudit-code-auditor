# Hardcoded secrets — `secrets.ts`

Source: [`src/lib/analysis/rules/secrets.ts`](../../src/lib/analysis/rules/secrets.ts) · Tests: [`tests/rules/secrets.test.ts`](../../tests/rules/secrets.test.ts), [`tests/unit/excerpt-redaction.test.ts`](../../tests/unit/excerpt-redaction.test.ts) · Category: `secrets`

Three detection paths, in decreasing order of confidence: fixed vendor-prefix regexes, a name-context fallback, and a conservative entropy fallback. Every finding's `snippet` is masked (first 4 + last 4 characters) before it's ever constructed — the raw value never appears in a `Finding`.

---

## secret-anthropic

**What it flags:** `sk-ant-api\d{2}-[A-Za-z0-9_-]{16,}` — matched before the OpenAI pattern deliberately, since Anthropic keys also start with `sk-`.

**Severity:** Critical.

**Risky example:** `const key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";`

**Limitations:** Format match only — cannot verify the key is still active vs. revoked, or real vs. a syntactically-valid fabrication.

**Tests:** `tests/fixtures/vulnerable/secret-anthropic-key.ts`

---

## secret-openai

**What it flags:** `sk-(proj-)?[A-Za-z0-9_-]{16,}`.

**Severity:** Critical.

**Risky example:** `const client = new OpenAI({ apiKey: "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR" });`

**Limitations:** Format match only.

**Tests:** `tests/fixtures/vulnerable/secret-openai-key.ts`

---

## secret-stripe

**What it flags:** `sk_(live|test)_[A-Za-z0-9]{16,}`.

**Severity:** Critical.

**Risky example:** `const stripeKey = "sk_live_51MfYs9L0yR2eR0f7vR0f7vR0f7vR0f7v";`

**Limitations:** Format match only — flags `sk_test_` the same as `sk_live_`, since a test key is still worth reviewing even if lower stakes.

**Tests:** `tests/fixtures/vulnerable/secret-stripe-live-key.ts`

---

## secret-aws

**What it flags:** `AKIA[0-9A-Z]{16}` (an AWS access key ID).

**Severity:** Critical.

**Risky example:** `const AWS_ACCESS_KEY_ID = "AKIAABCDEFGHIJKLMNOP";`

**Limitations:** Only the access key ID format is matched by a dedicated pattern; a corresponding AWS secret access key has no vendor-specific shape of its own and would only be caught by the name-context or entropy fallback.

**Tests:** `tests/fixtures/vulnerable/secret-aws-access-key.ts`

---

## secret-github-pat

**What it flags:** `gh[pousr]_[A-Za-z0-9]{20,}` or `github_pat_[A-Za-z0-9_]{20,}`.

**Severity:** Critical.

**Risky example:** `const token = "ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ"; fetchRepo(token);`

**Tests:** `tests/fixtures/vulnerable/secret-github-pat.ts`, `tests/independent-benchmark/samples/github-sync.js`

---

## secret-gitlab-pat

**What it flags:** `glpat-[A-Za-z0-9_-]{20}`.

**Severity:** Critical.

**Limitations:** Format match only.

**Tests:** covered structurally by `tests/rules/secrets.test.ts`'s vendor-pattern assertions (no dedicated fixture file — see `expected-results.json` for the full corpus).

---

## secret-slack-token

**What it flags:** `xox[baprs]-[A-Za-z0-9-]{10,}`.

**Severity:** High (not Critical — Slack tokens are scoped per-workspace/app, a narrower blast radius than a cloud-provider key).

**Limitations:** Format match only.

---

## secret-rsa-private-key

**What it flags:** A `-----BEGIN (RSA|EC|OPENSSH|DSA )?PRIVATE KEY-----` block.

**Severity:** Critical.

**Limitations:** Header-line match only — doesn't verify the block is a complete, valid key.

---

## secret-google-api-key

**What it flags:** `AIza[0-9A-Za-z_-]{35}`.

**Severity:** Medium — deliberately lower than other vendor matches, because Google API keys are routinely meant to be public (see the Firebase case below). **Downgraded to Info** specifically when the same key sits inside what looks like a Firebase web-app config object (a sibling key like `authDomain`/`projectId`/`messagingSenderId`, or a variable named `firebaseConfig`) — Firebase web config values are designed to ship to the browser and are not equivalent to a server-side secret.

**Risky example:** `const key = "AIzaSyD1234567890abcdefghijklmnopqrstuv"; connect(key);`

**Safe/informational example:**
```js
const firebaseConfig = {
  apiKey: "AIzaSyD1234567890abcdefghijklmnopqrstuv",   // downgraded to Info, not a leak
  authDomain: "demo-app.firebaseapp.com",
  projectId: "demo-app"
};
```

**Limitations:** The public-Firebase-config detection is a sibling-key/variable-name heuristic, not a guarantee — the real risk in that case is a misconfigured Firebase Security Rules setup, not the key being visible.

**Tests:** `tests/fixtures/edge-cases/secret-firebase-public-config.ts`

---

## secret-generic-assignment

**What it flags:** A string literal assigned to a variable/property whose name matches `API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|PWD|PRIVATE[_-]?KEY` (case-insensitive), with no known vendor format. Placeholder-shaped values (`your_key_here`, `example`, `changeme`, `<...>`, or anything under 8 characters) are excluded outright, not merely downgraded.

**Severity:** Medium.

**Risky example:** `const DB_PASSWORD = "Tr0ub4dor&3Correct horse"; connect(DB_PASSWORD);`

**Safe examples:**
```js
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });      // no literal at all — NOT flagged
const OPENAI_API_KEY = "your_key_here_example";                          // placeholder-shaped — excluded outright
```

**Limitations:** Purely name-based — can miss a secret under an unconventional name (false negative), and can occasionally flag a genuinely non-secret string that happens to sit in a credential-shaped variable (false positive).

**Tests:** `tests/fixtures/vulnerable/secret-generic-password-assignment.ts` · `tests/fixtures/safe/secret-env-var-usage.ts`, `secret-placeholder-example.ts`

---

## secret-high-entropy-string

**What it flags:** A string with **neither** a vendor format **nor** a credential-shaped name, that's still statistically random-looking enough to plausibly be a real token — e.g. a bearer token passed directly as a header value with no named variable at all, which the name-context check can't see by construction. The least precise check in this rule group, by design.

**All of the following are required:**
- Length ≥ 24 characters
- No whitespace
- Not URL/path-shaped (no `://`, doesn't start with `data:`/`/`/`./`/`../`/`www.`, no backslash)
- Not an npm/yarn/SRI integrity-hash format (`sha1-`/`sha256-`/`sha384-`/`sha512-` prefix)
- Not a UUID
- Not a canonical-length pure-hex string (32/40/64 chars — MD5/SHA-1/SHA-256 digest lengths)
- Contains both a letter and a digit
- Shannon entropy ≥ 4.5 bits/character

**Severity:** Always Low — explicitly the lowest-confidence check in the whole engine.

**Thresholds were calibrated empirically, not guessed**, against real samples before shipping:

| Sample | Entropy | Flagged? |
|---|---|---|
| A real-looking random token | 5.12 | Yes |
| SHA-1/SHA-256 git commit hash (40/64-char hex) | 3.7–3.8 | No (hex-alphabet cap + canonical-length exclusion) |
| UUID | 3.4 | No (explicit exclusion) |
| npm/yarn SRI integrity hash (`sha512-...`) | 5.75 | No (prefix exclusion — a real false positive found during calibration, before shipping) |
| CDN URL with a hashed filename | 4.58 | No (excluded by URL shape, not by entropy — too close to a real token's to separate safely by entropy alone) |
| Base64 image/font blob | 2.9–4.15 | No |
| SNAKE_CASE constant / i18n key / camelCase identifier | 3.9–4.4 | No |

**Risky examples:**
```js
const CONFIG_VALUE = "kJ8xz92mVpQ7Bn3zRtY6WcL0hF4sD1aG5eK9jH2p";  // non-credential name
fetch('/api/data', { headers: { Authorization: "kJ8xz92mVpQ7Bn3zRtY6WcL0hF4sD1aG5eK9jH2p" } }); // no variable at all
```

**Safe examples:** every row in the calibration table above has a dedicated adversarial fixture (see Tests).

**Limitations:** Will still miss a real secret that's hex-only or otherwise lands under the entropy threshold — a deliberate trade-off (lowering the bar would start catching hashes/identifiers instead). Has no way to exclude every possible non-secret high-entropy shape, only the ones actually calibrated against.

**Tests:** `tests/fixtures/vulnerable/secret-entropy-non-credential-name.ts`, `secret-entropy-authorization-header.ts` · `tests/fixtures/safe/secret-entropy-git-sha-not-flagged.ts`, `secret-entropy-npm-integrity-not-flagged.ts`, `secret-entropy-cdn-url-not-flagged.ts`, `secret-entropy-base64-image-not-flagged.ts`, `secret-entropy-long-identifier-not-flagged.ts`, `secret-uuid-not-flagged.ts` · `tests/independent-benchmark/samples/session-cache.js`, `build-info.js`

---

## Redaction (not a finding — a separate, related mechanism)

`redactSecrets()` in this file also scrubs raw text (e.g. the excerpt saved to opt-in `localStorage` history) using three passes matching the three detection paths above. This exists because a **live privacy bug was found and fixed** during a self-audit: the entropy fallback had no counterpart in the redaction path, so a real high-entropy secret could sail into local history completely unmasked even though the findings report itself correctly caught and masked it. See [`docs/self-audit-2026-09-03.md`](../self-audit-2026-09-03.md) finding F-01 and [`docs/model-improvements.md`](../model-improvements.md) for the full story, and `tests/unit/excerpt-redaction.test.ts` for the regression tests.
