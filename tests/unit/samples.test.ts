import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";
// @ts-expect-error - plain JS data module, no type declarations
import { SAMPLES } from "../../src/data/samples.js";

interface Sample {
    id: string;
    mode: "html" | "script" | "package-json";
    expect: string[];
    code: string;
}

// The checker's "Insert Sample" button is the first thing a new visitor is
// likely to click. Every sample promises a finding; this keeps that true.
describe("checker samples", () => {
    for (const sample of SAMPLES as Sample[]) {
        it(`"${sample.id}" produces the findings it's there to show`, () => {
            const result = analyze(sample.code, sample.mode);
            expect(result.status).toBe("ok");
            const found = result.findings.map((f) => f.ruleId);
            for (const ruleId of sample.expect) expect(found).toContain(ruleId);
        });

        it(`"${sample.id}" is detected as the right kind of input by Auto-detect`, () => {
            const result = analyze(sample.code, "auto");
            const found = result.findings.map((f) => f.ruleId);
            for (const ruleId of sample.expect) expect(found).toContain(ruleId);
        });
    }
});
