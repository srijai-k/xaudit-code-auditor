import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

/**
 * See docs/baseline-audit.md finding #4 (raw innerHTML XSS was never
 * detected at all). This test locks in the opposite failure mode: a
 * completely static literal assigned to innerHTML must NOT be flagged,
 * since there is no dynamic value involved at all.
 */
describe("regression: static literal innerHTML must not be flagged", () => {
    it("a fixed string literal assigned to innerHTML produces no xss finding", () => {
        const code = `function render() {\n  const el = document.getElementById('out');\n  el.innerHTML = '<b>Static Label</b>';\n  return el;\n}\n`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.filter((f) => f.category === "xss")).toHaveLength(0);
    });

    it("a template literal with no interpolation is treated as a literal", () => {
        const code = `function render() {\n  const el = document.getElementById('out');\n  el.innerHTML = \`<b>Static Label</b>\`;\n  return el;\n}\n`;
        const result = analyze(code, "script");
        expect(result.findings.filter((f) => f.category === "xss")).toHaveLength(0);
    });

    it("a dynamic assignment to innerHTML IS still caught (sanity check the rule is live)", () => {
        const code = `function render(userInput) {\n  const el = document.getElementById('out');\n  el.innerHTML = userInput;\n  return el;\n}\n`;
        const result = analyze(code, "script");
        expect(result.findings.some((f) => f.ruleId === "xss-inner-html")).toBe(true);
    });

    it("FIXED: a literal assigned to a variable one hop before the sink is no longer flagged", () => {
        // This used to false-positive: the sink's expression is a plain Identifier,
        // which is never a StringLiteral/TemplateLiteral by syntax alone, so the
        // rule couldn't previously tell `safe` traced back to a literal.
        const code = `function render() {\n  const safe = "<b>hi</b>";\n  const el = document.getElementById('x');\n  el.innerHTML = safe;\n  return el;\n}\n`;
        const result = analyze(code, "script");
        expect(result.findings.filter((f) => f.category === "xss")).toHaveLength(0);
    });

    it("KNOWN LIMITATION: a literal passed through a SECOND variable is still (incorrectly) flagged", () => {
        // Same-scope tracing is exactly one hop. `safe` traces to identifier
        // `original`, not directly to a literal, so it's not resolved further.
        const code = `function render() {\n  const original = "<b>hi</b>";\n  const safe = original;\n  const el = document.getElementById('x');\n  el.innerHTML = safe;\n  return el;\n}\n`;
        const result = analyze(code, "script");
        expect(result.findings.some((f) => f.ruleId === "xss-inner-html")).toBe(true);
    });

    it("FIXED: a sanitizer call one hop before the sink is now recognized (downgraded to low, not high)", () => {
        const code = `import DOMPurify from 'dompurify';\nfunction render(userInput) {\n  const clean = DOMPurify.sanitize(userInput);\n  const el = document.getElementById('out');\n  el.innerHTML = clean;\n  return el;\n}\n`;
        const result = analyze(code, "script");
        const finding = result.findings.find((f) => f.ruleId === "xss-inner-html");
        expect(finding).toBeDefined();
        expect(finding?.severity).toBe("low");
    });
});
