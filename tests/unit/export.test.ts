import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";
import { generateSarif } from "../../src/lib/export/sarif-generator";
import { generateJsonExport } from "../../src/lib/export/json-generator";

/**
 * Structural tests against the SARIF 2.1.0 spec's required shape — not a
 * full schema validation (no offline copy of the official JSON schema is
 * bundled, consistent with this project's no-network-dependency policy),
 * but enough to catch a real structural regression: missing required
 * fields, wrong types, or a severity mapping that silently breaks.
 */
describe("unit: SARIF export", () => {
    const code = 'function render(userInput) { el.innerHTML = userInput; }\nconst key = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";\n';
    const result = analyze(code, "script");

    it("produces a valid top-level SARIF 2.1.0 envelope", () => {
        const sarif = generateSarif(result) as any;
        expect(sarif.version).toBe("2.1.0");
        expect(sarif.$schema).toContain("sarif-schema-2.1.0.json");
        expect(Array.isArray(sarif.runs)).toBe(true);
        expect(sarif.runs).toHaveLength(1);
    });

    it("declares the tool and lists every distinct rule that actually fired, deduplicated", () => {
        const sarif = generateSarif(result) as any;
        const driver = sarif.runs[0].tool.driver;
        expect(driver.name).toBe("XAUDIT");
        const ruleIds = driver.rules.map((r: any) => r.id);
        expect(new Set(ruleIds).size).toBe(ruleIds.length); // no duplicate rule descriptors
        expect(ruleIds).toContain("xss-inner-html");
        expect(ruleIds).toContain("secret-openai");
    });

    it("every rule descriptor's helpUri points at a real, stable per-ruleId anchor in docs/rules/", () => {
        const sarif = generateSarif(result) as any;
        for (const rule of sarif.runs[0].tool.driver.rules) {
            expect(rule.helpUri).toMatch(/^https:\/\/github\.com\/srijai-k\/xaudit-code-auditor\/blob\/main\/docs\/rules\/[a-z-]+\.md#/);
            expect(rule.helpUri.endsWith(`#${rule.id}`)).toBe(true);
        }
    });

    it("every result has a ruleId, a SARIF-valid level, a message, and a location", () => {
        const sarif = generateSarif(result) as any;
        const results = sarif.runs[0].results;
        expect(results.length).toBe(result.findings.length);
        for (const r of results) {
            expect(typeof r.ruleId).toBe("string");
            expect(["error", "warning", "note", "none"]).toContain(r.level);
            expect(typeof r.message.text).toBe("string");
            expect(r.locations[0].physicalLocation.artifactLocation.uri).toBe("pasted-input");
            expect(typeof r.locations[0].physicalLocation.region.startLine).toBe("number");
        }
    });

    it("maps severity to SARIF level correctly (critical/high -> error, medium -> warning, low/info -> note)", () => {
        const sarif = generateSarif(result) as any;
        const bySeverity = new Map(result.findings.map((f) => [f.ruleId, f.severity]));
        for (const r of sarif.runs[0].results) {
            const severity = bySeverity.get(r.ruleId);
            if (severity === "critical" || severity === "high") expect(r.level).toBe("error");
            if (severity === "medium") expect(r.level).toBe("warning");
            if (severity === "low" || severity === "info") expect(r.level).toBe("note");
        }
    });

    it("includes the safer-example remediation text directly on each result (the deliberate alternative to a fabricated external link)", () => {
        const sarif = generateSarif(result) as any;
        for (const r of sarif.runs[0].results) {
            expect(typeof r.properties.saferExample).toBe("string");
            expect(r.properties.saferExample.length).toBeGreaterThan(0);
        }
    });

    it("never includes a raw, unmasked secret value — findings already come pre-masked from the rule, and export must not undo that", () => {
        const sarif = generateSarif(result) as any;
        const serialized = JSON.stringify(sarif);
        expect(serialized).not.toContain("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR");
    });

    it("produces valid JSON — round-trips through JSON.parse without throwing", () => {
        const sarif = generateSarif(result);
        expect(() => JSON.parse(JSON.stringify(sarif))).not.toThrow();
    });
});

describe("unit: JSON export", () => {
    const code = "function render(userInput) { el.innerHTML = userInput; }";
    const result = analyze(code, "script");

    it("wraps the full AnalysisResult with a tool identifier and the standard disclaimer", () => {
        const json = generateJsonExport(result) as any;
        expect(json.tool).toBe("XAUDIT");
        expect(json.disclaimer).toContain("not confirmed vulnerabilities");
        expect(json.result).toEqual(result);
    });

    it("round-trips through JSON.stringify/parse without throwing or losing findings", () => {
        const json = generateJsonExport(result);
        const roundTripped = JSON.parse(JSON.stringify(json));
        expect(roundTripped.result.findings).toHaveLength(result.findings.length);
    });
});
