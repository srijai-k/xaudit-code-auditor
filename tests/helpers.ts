import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { analyze } from "../src/lib/analysis/analyze";
import type { AnalysisResult, Severity } from "../src/lib/analysis/types";
import expectedResults from "./expected-results.json" with { type: "json" };

const testsDir = path.dirname(fileURLToPath(import.meta.url));

export interface FixtureExpectation {
    path: string;
    group: string;
    bucket: "vulnerable" | "safe" | "edge-cases";
    expectRuleIds: string[];
    expectSeverity: Severity | null;
    forbidSeverity: Severity | null;
    note: string;
}

const MANIFEST = expectedResults as Record<string, FixtureExpectation>;

export function fixtureIdsInGroup(group: string): string[] {
    return Object.keys(MANIFEST).filter((id) => MANIFEST[id].group === group);
}

export function loadFixture(id: string): { code: string; expectation: FixtureExpectation } {
    const expectation = MANIFEST[id];
    if (!expectation) throw new Error(`No expectation entry for fixture "${id}"`);
    const code = readFileSync(path.join(testsDir, expectation.path), "utf8");
    return { code, expectation };
}

export function analyzeFixture(id: string): { result: AnalysisResult; expectation: FixtureExpectation } {
    const { code, expectation } = loadFixture(id);
    const result = analyze(code, "script");
    return { result, expectation };
}

const SEVERITY_RANK: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

export function hasFindingAtOrAbove(result: AnalysisResult, severity: Severity): boolean {
    return result.findings.some((f) => SEVERITY_RANK[f.severity] >= SEVERITY_RANK[severity]);
}

export { MANIFEST };

/**
 * Shared suite body used by every tests/rules/*.test.ts file: asserts that
 * every "vulnerable" fixture in this group produces at least the expected
 * rule ID(s), and every "safe"/"edge-cases" fixture with a `forbidSeverity`
 * produces nothing at or above that severity.
 */
export function runGroupSuite(suiteName: string, group: string): void {
    describe(`rule: ${suiteName}`, () => {
        const ids = fixtureIdsInGroup(group);
        it("has at least one fixture", () => {
            expect(ids.length).toBeGreaterThan(0);
        });

        for (const id of ids) {
            it(id, () => {
                const { result, expectation } = analyzeFixture(id);
                expect(result.status).toBe("ok");

                if (expectation.bucket === "vulnerable" || expectation.expectRuleIds.length > 0) {
                    for (const ruleId of expectation.expectRuleIds) {
                        const found = result.findings.some((f) => f.ruleId === ruleId);
                        expect(found, `expected finding "${ruleId}" for ${id} (${expectation.note}); got: ${JSON.stringify(result.findings.map((f) => f.ruleId))}`).toBe(true);
                    }
                    if (expectation.expectSeverity) {
                        const match = result.findings.find((f) => expectation.expectRuleIds.includes(f.ruleId));
                        expect(match?.severity, `expected severity "${expectation.expectSeverity}" for ${id}`).toBe(expectation.expectSeverity);
                    }
                }

                if (expectation.forbidSeverity) {
                    expect(
                        hasFindingAtOrAbove(result, expectation.forbidSeverity),
                        `expected no finding >= ${expectation.forbidSeverity} for ${id} (${expectation.note}) but got: ${JSON.stringify(result.findings.map((f) => [f.ruleId, f.severity]))}`,
                    ).toBe(false);
                }
            });
        }
    });
}
