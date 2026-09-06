// Runs XAUDIT's real, unmodified production DOM-XSS rule (src/lib/analysis/rules/xss.ts,
// via the same parseSource() every other rule uses) against the frozen corpus
// in fixtures/, and writes the raw per-case output to results/baseline-results.json.
//
// This script does NOT compute precision/recall/F1 — see score-results.ts,
// which is the single scorer both run-baseline.ts and run-experiment.ts feed,
// so there is no risk of the two scoring methods silently drifting apart.
//
// Usage: npx tsx tests/experiments/xss-sanitizer-recognition/run-baseline.ts
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSource } from "../../../src/lib/analysis/parse";
import { xssRule } from "../../../src/lib/analysis/rules/xss";

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
    const findings = xssRule.run({ ast: parsed.ast, code }).map((f) => ({ ruleId: f.ruleId, severity: f.severity }));
    results.push({ caseId: c.caseId, file: c.file, parseError: null, findings });
}

const outPath = path.join(root, "results", "baseline-results.json");
writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), implementation: "baseline (src/lib/analysis/rules/xss.ts, unmodified)", results }, null, 2), "utf8");
console.log(`Wrote ${outPath} — ${results.length} cases, ${results.filter((r) => r.parseError).length} parse error(s).`);
