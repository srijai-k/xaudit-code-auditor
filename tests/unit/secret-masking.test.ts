import { describe, it, expect } from "vitest";
import { maskSecret } from "../../src/lib/analysis/rules/secrets";

describe("unit: maskSecret", () => {
    it("keeps only first 4 and last 4 characters for long secrets", () => {
        const masked = maskSecret("sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR");
        expect(masked.startsWith("sk-p")).toBe(true);
        expect(masked.endsWith("NOPQR")).toBe(false); // last 4 only
        expect(masked.endsWith("OPQR")).toBe(true);
        expect(masked).not.toContain("abcdefghijklmnop");
    });

    it("fully masks very short values instead of leaking them via short head/tail", () => {
        const masked = maskSecret("shortval");
        expect(masked).toBe("*".repeat("shortval".length));
    });
});
