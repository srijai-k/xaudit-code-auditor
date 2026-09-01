import { describe, it, expect } from "vitest";
import { runHtmlChecks } from "../../src/lib/analysis/rules/html";

describe("unit: HTML hygiene checks (attribute-based, not AST, not security-grade)", () => {
    it("flags a missing viewport meta tag on a full document", () => {
        const html = `<!DOCTYPE html><html><head><title>x</title></head><body></body></html>`;
        const findings = runHtmlChecks(html);
        expect(findings.some((f) => f.ruleId === "html-missing-viewport")).toBe(true);
    });

    it("does not flag viewport when present", () => {
        const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>`;
        const findings = runHtmlChecks(html);
        expect(findings.some((f) => f.ruleId === "html-missing-viewport")).toBe(false);
    });

    it("flags images missing alt text", () => {
        const html = `<!DOCTYPE html><html><body><img src="a.png"><img src="b.png" alt="a real description"></body></html>`;
        const findings = runHtmlChecks(html);
        const finding = findings.find((f) => f.ruleId === "html-missing-alt");
        expect(finding).toBeDefined();
        expect(finding?.message).toContain("1 of 2");
    });

    it("never treats JSX onClick={...} as an inline HTML event handler (this module only runs on markup, never on JSX source, but the regex itself is also quote-anchored)", () => {
        const jsxLike = `<button onClick={handleClick}>Go</button>`;
        const findings = runHtmlChecks(jsxLike);
        expect(findings.some((f) => f.ruleId === "html-inline-event-handler")).toBe(false);
    });

    it("flags a real inline HTML event handler with a literal quote", () => {
        const html = `<button onclick="doStuff()">Go</button>`;
        const findings = runHtmlChecks(html);
        expect(findings.some((f) => f.ruleId === "html-inline-event-handler")).toBe(true);
    });

    it("every finding tops out at medium severity — this is a hygiene check, not a vulnerability scanner", () => {
        const html = `<!DOCTYPE html><html><body><img src="a.png"><button onclick="x()"></button></body></html>`;
        const findings = runHtmlChecks(html);
        expect(findings.every((f) => f.severity === "medium" || f.severity === "low" || f.severity === "info")).toBe(true);
    });
});
