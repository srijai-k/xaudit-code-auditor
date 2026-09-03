import { describe, it, expect } from "vitest";
import { redactSecrets } from "../../src/lib/analysis/rules/secrets";

/**
 * Regression test for a real bug found during manual verification of the
 * opt-in "save locally" flow: storage.ts/history.ts built their masked
 * excerpt by slicing the first ~120 characters of the RAW pasted code,
 * with a comment claiming secrets were "already masked by the rules" —
 * which was never actually true for this specific string, only for
 * Finding.snippet. A real secret sitting early in the input would have
 * been written to localStorage in plaintext under a field literally named
 * "codeExcerptMasked". redactSecrets() + maskCodeExcerpt() (storage.ts)
 * close that gap.
 */
describe("regression: redactSecrets() actually redacts vendor-shaped secrets from raw text", () => {
    it("redacts an OpenAI-shaped key embedded in arbitrary code text", () => {
        const code = 'const apiKey = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR"; console.log(apiKey);';
        const redacted = redactSecrets(code);
        expect(redacted).not.toContain("abcdefghijklmnopqrstuvwxyz");
        expect(redacted).toContain("console.log"); // rest of the code is untouched
    });

    it("redacts a secret sitting within the first 120 characters specifically (the excerpt window)", () => {
        const code = 'const apiKey = "sk-live-abcdefghijklmnopqrstuvwx1234"; eval(apiKey);';
        const redacted = redactSecrets(code).slice(0, 120);
        expect(redacted).not.toContain("abcdefghijklmnopqrstuvwx1234");
    });

    it("is a no-op on text with no secrets in it", () => {
        const code = "function add(a, b) { return a + b; }";
        expect(redactSecrets(code)).toBe(code);
    });

    it("redacts multiple different vendor secrets in the same text", () => {
        const code = 'const a = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR"; const b = "AKIAABCDEFGHIJKLMNOP";';
        const redacted = redactSecrets(code);
        expect(redacted).not.toContain("abcdefghijklmnopqrstuvwxyz");
        expect(redacted).not.toContain("ABCDEFGHIJKLMNOP");
    });
});

/**
 * REGRESSION FIX for a real bug found LIVE, in this browser's own
 * localStorage, during a self-audit — not by a rule, not by a fixture, not
 * reported by a user. Once the secrets rule's entropy fallback (path 3,
 * "secret-high-entropy-string") started catching non-vendor high-entropy
 * secrets in the findings report, redactSecrets() below still only knew
 * about vendor-prefixed formats — so a real, non-vendor secret (exactly
 * the case the entropy fallback exists to catch) sailed straight into the
 * "safe to persist locally" history excerpt completely unmasked. Confirmed
 * reproducible before this fix: a bearer-token header value used in this
 * session's own manual testing sat in `localStorage`'s
 * `xaudit:auditHistory` entry in full plaintext.
 */
describe("regression: redactSecrets() also catches non-vendor high-entropy secrets (the localStorage leak this was found in)", () => {
    it("redacts a bare, non-vendor high-entropy token with no credential-shaped name", () => {
        const code = 'function callApi() { return fetch("/api/data", { headers: { Authorization: "kJ8xz92mVpQ7Bn3zRtY6WcL0hF4sD1aG5eK9jH2p" } }); }';
        const redacted = redactSecrets(code);
        expect(redacted).not.toContain("kJ8xz92mVpQ7Bn3zRtY6WcL0hF4sD1aG5eK9jH2p");
        expect(redacted).toContain("callApi"); // rest of the code is untouched
    });

    it("does not redact a git commit SHA (adversarial: high length, moderate entropy, but excluded by canonical-hash-length shape)", () => {
        const code = 'const commitSha = "da39a3ee5e6b4b0d3255bfef95601890afd80709";';
        expect(redactSecrets(code)).toBe(code);
    });

    it("does not redact a CDN URL with a hashed filename (adversarial: URL-shaped, excluded even though its entropy is close to a real token's)", () => {
        const code = 'const assetUrl = "https://cdn.example.com/assets/main-8f3a9c2e1b7d4f6a.js";';
        expect(redactSecrets(code)).toBe(code);
    });

    it("does not double-mangle an already vendor-redacted secret (masked output is short and asterisk-delimited, well under the entropy floor)", () => {
        const code = 'const apiKey = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";';
        const redacted = redactSecrets(code);
        expect(redacted).not.toContain("abcdefghijklmnopqrstuvwxyz");
        expect(redacted).toContain("sk-p");
        expect(redacted).toContain("OPQR");
        expect(redacted).toContain("const apiKey ="); // surrounding code untouched
    });
});
