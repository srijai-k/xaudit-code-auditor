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
});
