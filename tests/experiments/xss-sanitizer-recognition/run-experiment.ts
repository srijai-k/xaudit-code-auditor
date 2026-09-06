// Runs the isolated experimental DOM-XSS rule variant
// (src/lib/analysis/rules/xss-sanitizer-recognition.experimental.ts) against
// the SAME frozen corpus used by run-baseline.ts, and writes the raw
// per-case output to results/experimental-results.json.
//
// Usage: npx tsx tests/experiments/xss-sanitizer-recognition/run-experiment.ts
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSource } from "../../../src/lib/analysis/parse";
import { experimentalXssRule } from "../../../src/lib/analysis/rules/xss-sanitizer-recognition.experimental";

const root = path.dirname(fileURLToPath(import.meta.url));
const groundTruth = JSON.parse(readFileSync(path.join(root, "ground-truth.json"), "utf8"));

interface CaseResult {
    caseId: number;
    file: string;
    parseError: string | null;
    findings: { ruleId: string; severity: string }[];
}

const results: CaseResult[] = [];

for (const c of groundTruth.cases as Array<{ caseId: number; file: string }>) {
    const code = readFileSync(path.join(root, "fixtures", c.file), "utf8");
    const parsed = parseSource(code);
    if (!parsed.ok) {
        results.push({ caseId: c.caseId, file: c.file, parseError: parsed.error, findings: [] });
        continue;
    }
    const findings = experimentalXssRule.run({ ast: parsed.ast, code }).map((f) => ({ ruleId: f.ruleId, severity: f.severity }));
    results.push({ caseId: c.caseId, file: c.file, parseError: null, findings });
}

const outPath = path.join(root, "results", "experimental-results.json");
writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), implementation: "experimental (src/lib/analysis/rules/xss-sanitizer-recognition.experimental.ts)", results }, null, 2), "utf8");
console.log(`Wrote ${outPath} — ${results.length} cases, ${results.filter((r) => r.parseError).length} parse error(s).`);
