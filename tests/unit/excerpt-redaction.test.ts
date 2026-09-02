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
