// The single scorer for both run-baseline.ts and run-experiment.ts output —
// scoring logic lives here exactly once so baseline and experimental are
// held to the identical method (the same (ruleId, severity) multiset match
// scripts/run-independent-benchmark.ts already uses elsewhere in this repo).
//
// This script only ever READS ground-truth.json and the two raw results
// files; it never adjusts either after the fact.
//
// Usage:
//   npx tsx tests/experiments/xss-sanitizer-recognition/score-results.ts baseline
//   npx tsx tests/experiments/xss-sanitizer-recognition/score-results.ts experimental
//   npx tsx tests/experiments/xss-sanitizer-recognition/score-results.ts compare
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(root, "results");

interface Pair {
    ruleId: string;
    severity: string;
}
interface GroundTruthCase {
    caseId: number;
    file: string;
    category: string;
    hasUnsafeSink: boolean | null;
    expected: Pair[] | null;
    acceptableAsRecognizedSanitizer: boolean;
    ambiguousOrUnsupported: boolean;
    parserErrorExpected?: boolean;
    rationale: string;
}
interface CaseResult {
    caseId: number;
    file: string;
    parseError: string | null;
    findings: Pair[];
}

function pairKey(p: Pair): string {
    return `${p.ruleId}::${p.severity}`;
}

function loadGroundTruth(): GroundTruthCase[] {
    return JSON.parse(readFileSync(path.join(root, "ground-truth.json"), "utf8")).cases;
}

function loadResults(name: "baseline" | "experimental"): CaseResult[] {
    const file = path.join(resultsDir, `${name}-results.json`);
    if (!existsSync(file)) throw new Error(`${file} does not exist — run run-${name}.ts first.`);
    return JSON.parse(readFileSync(file, "utf8")).results;
}

interface ScoredCase {
    caseId: number;
    file: string;
    category: string;
    ambiguousOrUnsupported: boolean;
    parserErrorExpected: boolean;
    parserErrorActual: boolean;
    parserErrorCorrect: boolean;
    expected: Pair[];
    actual: Pair[];
    tp: Pair[];
    fp: Pair[];
    fn: Pair[];
    isTrueNegative: boolean;
    fullyCorrect: boolean;
    recognizedSanitizerFindings: number;
    highOrCriticalFindings: number;
}

function score(groundTruth: GroundTruthCase[], results: CaseResult[]): ScoredCase[] {
    const byId = new Map(results.map((r) => [r.caseId, r]));
    return groundTruth.map((gt): ScoredCase => {
        const r = byId.get(gt.caseId);
        if (!r) throw new Error(`No result for case ${gt.caseId}`);
        const parserErrorExpected = !!gt.parserErrorExpected;
        const parserErrorActual = r.parseError !== null;
        if (parserErrorExpected || parserErrorActual) {
            return {
                caseId: gt.caseId,
                file: gt.file,
                category: gt.category,
                ambiguousOrUnsupported: gt.ambiguousOrUnsupported,
                parserErrorExpected,
                parserErrorActual,
                parserErrorCorrect: parserErrorExpected === parserErrorActual,
                expected: [],
                actual: [],
                tp: [],
                fp: [],
                fn: [],
                isTrueNegative: false,
                fullyCorrect: parserErrorExpected === parserErrorActual,
                recognizedSanitizerFindings: 0,
                highOrCriticalFindings: 0,
            };
        }
        const expected = gt.expected ?? [];
        const actual = r.findings;
        const remaining = [...actual];
        const tp: Pair[] = [];
        const fn: Pair[] = [];
        for (const exp of expected) {
            const idx = remaining.findIndex((a) => pairKey(a) === pairKey(exp));
            if (idx >= 0) {
                tp.push(exp);
                remaining.splice(idx, 1);
            } else {
                fn.push(exp);
            }
        }
        const fp = remaining;
        const isTrueNegative = expected.length === 0 && actual.length === 0;
        return {
            caseId: gt.caseId,
            file: gt.file,
            category: gt.category,
            ambiguousOrUnsupported: gt.ambiguousOrUnsupported,
            parserErrorExpected: false,
            parserErrorActual: false,
            parserErrorCorrect: true,
            expected,
            actual,
            tp,
            fp,
            fn,
            isTrueNegative,
            fullyCorrect: fp.length === 0 && fn.length === 0,
            recognizedSanitizerFindings: actual.filter((a) => a.severity === "low").length,
            highOrCriticalFindings: actual.filter((a) => a.severity === "high" || a.severity === "critical").length,
        };
    });
}

interface Metrics {
    totalCases: number;
    parserErrorCases: number;
    parserErrorMismatches: number;
    scoredCases: number;
    coreCases: number;
    tp: number;
    fp: number;
    fn: number;
    tn: number;
    precision: number;
    recall: number;
    f1: number;
    highOrCriticalFindings: number;
    recognizedSanitizerFindings: number;
    ambiguousCasesTotal: number;
    ambiguousCasesCorrect: number;
    ambiguousTp: number;
    ambiguousFp: number;
    ambiguousFn: number;
}

/**
 * Headline TP/FP/FN/TN/precision/recall/F1 are computed from the CORE
 * corpus only — every scored case EXCEPT the 6 marked
 * `ambiguousOrUnsupported` in ground-truth.json (cases 34-39: disclosed,
 * deliberate scope limitations — local DOMPurify aliasing, destructuring,
 * cross-file wrappers, conditionals, an extracted function reference).
 *
 * This was a real bug in an earlier version of this script, caught the
 * same day it was pointed out: protocol.md already stated the intent
 * ("tracked separately... so a recall-on-recognition limitation is never
 * conflated with a recall-on-vulnerability-detection failure") but the
 * original computeMetrics() blended ambiguous cases into the headline sums
 * anyway. Fixing the aggregation to match the already-frozen methodology
 * is not the same as redefining an expected outcome — no case's `expected`
 * value in ground-truth.json changed, and neither did the frozen corpus or
 * baseline raw results. Only which bucket a case's TP/FP/FN counts roll
 * into, for the metric the decision criteria in protocol.md actually hinge
 * on, changed. The ambiguous group's own tp/fp/fn is still reported in
 * full below (ambiguousTp/ambiguousFp/ambiguousFn), never hidden — it is
 * simply not part of the headline precision/recall/F1 computation.
 */
function computeMetrics(scored: ScoredCase[]): Metrics {
    const parserCases = scored.filter((s) => s.parserErrorExpected || s.parserErrorActual);
    const nonParserCases = scored.filter((s) => !s.parserErrorExpected && !s.parserErrorActual);
    const coreCases = nonParserCases.filter((c) => !c.ambiguousOrUnsupported);
    const ambiguous = nonParserCases.filter((c) => c.ambiguousOrUnsupported);

    const tp = coreCases.reduce((s, c) => s + c.tp.length, 0);
    const fp = coreCases.reduce((s, c) => s + c.fp.length, 0);
    const fn = coreCases.reduce((s, c) => s + c.fn.length, 0);
    const tn = coreCases.filter((c) => c.isTrueNegative).length;
    const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    return {
        totalCases: scored.length,
        parserErrorCases: parserCases.length,
        parserErrorMismatches: parserCases.filter((c) => !c.parserErrorCorrect).length,
        scoredCases: nonParserCases.length,
        coreCases: coreCases.length,
        tp,
        fp,
        fn,
        tn,
        precision,
        recall,
        f1,
        highOrCriticalFindings: nonParserCases.reduce((s, c) => s + c.highOrCriticalFindings, 0),
        recognizedSanitizerFindings: nonParserCases.reduce((s, c) => s + c.recognizedSanitizerFindings, 0),
        ambiguousCasesTotal: ambiguous.length,
        ambiguousCasesCorrect: ambiguous.filter((c) => c.fullyCorrect).length,
        ambiguousTp: ambiguous.reduce((s, c) => s + c.tp.length, 0),
        ambiguousFp: ambiguous.reduce((s, c) => s + c.fp.length, 0),
        ambiguousFn: ambiguous.reduce((s, c) => s + c.fn.length, 0),
    };
}

function fmt(n: number): string {
    return n.toFixed(2);
}

function writeMetrics(name: "baseline" | "experimental", scored: ScoredCase[], metrics: Metrics) {
    const outPath = path.join(resultsDir, `${name}-metrics.json`);
    writeFileSync(
        outPath,
        JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                implementation: name,
                metrics,
                perCase: scored.map((s) => ({
                    caseId: s.caseId,
                    file: s.file,
                    category: s.category,
                    ambiguousOrUnsupported: s.ambiguousOrUnsupported,
                    parserError: s.parserErrorExpected || s.parserErrorActual ? { expected: s.parserErrorExpected, actual: s.parserErrorActual, correct: s.parserErrorCorrect } : null,
                    expected: s.expected,
                    actual: s.actual,
                    tp: s.tp,
                    fp: s.fp,
                    fn: s.fn,
                    fullyCorrect: s.fullyCorrect,
                })),
            },
            null,
            2,
        ),
        "utf8",
    );
    console.log(
        `Wrote ${outPath} — core(${metrics.coreCases}): TP=${metrics.tp} FP=${metrics.fp} FN=${metrics.fn} TN=${metrics.tn} precision=${fmt(metrics.precision)} recall=${fmt(metrics.recall)} F1=${fmt(metrics.f1)} — ambiguous(${metrics.ambiguousCasesTotal}): TP=${metrics.ambiguousTp} FP=${metrics.ambiguousFp} FN=${metrics.ambiguousFn}, ${metrics.ambiguousCasesCorrect}/${metrics.ambiguousCasesTotal} correct`,
    );
}

function pairsToStr(pairs: Pair[]): string {
    return pairs.length === 0 ? "(none)" : pairs.map((p) => `${p.ruleId}/${p.severity}`).join(", ");
}

function writeComparison(groundTruth: GroundTruthCase[], baseScored: ScoredCase[], expScored: ScoredCase[], baseMetrics: Metrics, expMetrics: Metrics) {
    const gtById = new Map(groundTruth.map((g) => [g.caseId, g]));
    let md = `# Baseline vs. Experimental — Comparison\n\n`;
    md += `Generated by \`score-results.ts compare\` from \`results/baseline-results.json\`, \`results/experimental-results.json\`, and \`ground-truth.json\`. Neither results file nor the ground truth was edited after this comparison was generated.\n\n`;
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += `## Overall metrics\n\n`;
    md += `TP/FP/FN/TN/Precision/Recall/F1 below are computed from the **${baseMetrics.coreCases} core cases only** — every scored case except the ${baseMetrics.ambiguousCasesTotal} marked \`ambiguousOrUnsupported\` in \`ground-truth.json\` (cases 34-39: disclosed, deliberate scope limitations — local DOMPurify aliasing, destructuring, cross-file wrappers, conditionals, an extracted function reference), which are reported in their own row instead. This split was already the stated intent in \`protocol.md\` ("tracked separately... so a recall-on-recognition limitation is never conflated with a recall-on-vulnerability-detection failure") — an earlier version of this script blended them into the headline numbers anyway; that was a scoring bug, fixed here, not a change to any case's expected outcome.\n\n`;
    md += `| Metric | Baseline | Experimental | Difference |\n|---|---:|---:|---:|\n`;
    const diff = (a: number, b: number) => (b - a >= 0 ? `+${b - a}` : `${b - a}`);
    const diffF = (a: number, b: number) => (b - a >= 0 ? `+${fmt(b - a)}` : `${fmt(b - a)}`);
    md += `| TP (core) | ${baseMetrics.tp} | ${expMetrics.tp} | ${diff(baseMetrics.tp, expMetrics.tp)} |\n`;
    md += `| FP (core) | ${baseMetrics.fp} | ${expMetrics.fp} | ${diff(baseMetrics.fp, expMetrics.fp)} |\n`;
    md += `| FN (core) | ${baseMetrics.fn} | ${expMetrics.fn} | ${diff(baseMetrics.fn, expMetrics.fn)} |\n`;
    md += `| TN (core) | ${baseMetrics.tn} | ${expMetrics.tn} | ${diff(baseMetrics.tn, expMetrics.tn)} |\n`;
    md += `| Precision (core) | ${fmt(baseMetrics.precision)} | ${fmt(expMetrics.precision)} | ${diffF(baseMetrics.precision, expMetrics.precision)} |\n`;
    md += `| Recall (core) | ${fmt(baseMetrics.recall)} | ${fmt(expMetrics.recall)} | ${diffF(baseMetrics.recall, expMetrics.recall)} |\n`;
    md += `| F1 (core) | ${fmt(baseMetrics.f1)} | ${fmt(expMetrics.f1)} | ${diffF(baseMetrics.f1, expMetrics.f1)} |\n`;
    md += `| High/Critical findings (all ${baseMetrics.scoredCases} scored cases) | ${baseMetrics.highOrCriticalFindings} | ${expMetrics.highOrCriticalFindings} | ${diff(baseMetrics.highOrCriticalFindings, expMetrics.highOrCriticalFindings)} |\n`;
    md += `| Recognized-sanitizer (low) findings (all ${baseMetrics.scoredCases} scored cases) | ${baseMetrics.recognizedSanitizerFindings} | ${expMetrics.recognizedSanitizerFindings} | ${diff(baseMetrics.recognizedSanitizerFindings, expMetrics.recognizedSanitizerFindings)} |\n`;
    md += `| Parser errors | ${baseMetrics.parserErrorCases} | ${expMetrics.parserErrorCases} | ${diff(baseMetrics.parserErrorCases, expMetrics.parserErrorCases)} |\n`;
    md += `| **Ambiguous/unsupported group (${baseMetrics.ambiguousCasesTotal} cases) — TP** | ${baseMetrics.ambiguousTp} | ${expMetrics.ambiguousTp} | ${diff(baseMetrics.ambiguousTp, expMetrics.ambiguousTp)} |\n`;
    md += `| Ambiguous/unsupported group — FP | ${baseMetrics.ambiguousFp} | ${expMetrics.ambiguousFp} | ${diff(baseMetrics.ambiguousFp, expMetrics.ambiguousFp)} |\n`;
    md += `| Ambiguous/unsupported group — FN | ${baseMetrics.ambiguousFn} | ${expMetrics.ambiguousFn} | ${diff(baseMetrics.ambiguousFn, expMetrics.ambiguousFn)} |\n`;
    md += `| Ambiguous/unsupported group — cases fully correct (of ${baseMetrics.ambiguousCasesTotal}) | ${baseMetrics.ambiguousCasesCorrect} | ${expMetrics.ambiguousCasesCorrect} | ${diff(baseMetrics.ambiguousCasesCorrect, expMetrics.ambiguousCasesCorrect)} |\n\n`;

    md += `## Case-by-case change table\n\n`;
    md += `| Case | Category | Baseline output | Experimental output | Correct (baseline) | Correct (experimental) | Notes |\n|---|---|---|---|---|---|---|\n`;
    for (const gt of groundTruth) {
        const b = baseScored.find((s) => s.caseId === gt.caseId)!;
        const e = expScored.find((s) => s.caseId === gt.caseId)!;
        const bOut = b.parserErrorExpected || b.parserErrorActual ? (b.parserErrorActual ? "parse error" : "(parsed — no error)") : pairsToStr(b.actual);
        const eOut = e.parserErrorExpected || e.parserErrorActual ? (e.parserErrorActual ? "parse error" : "(parsed — no error)") : pairsToStr(e.actual);
        const changed = bOut !== eOut ? " **← changed**" : "";
        md += `| ${gt.caseId} (\`${gt.file}\`) | ${gt.category} | ${bOut} | ${eOut}${changed} | ${b.fullyCorrect ? "yes" : "no"} | ${e.fullyCorrect ? "yes" : "no"} | ${gt.ambiguousOrUnsupported ? "disclosed limitation case — " : ""}${gt.rationale} |\n`;
    }

    md += `\n## Every disagreement between baseline and experimental\n\n`;
    const changedCases = groundTruth.filter((gt) => {
        const b = baseScored.find((s) => s.caseId === gt.caseId)!;
        const e = expScored.find((s) => s.caseId === gt.caseId)!;
        return pairsToStr(b.actual) !== pairsToStr(e.actual) || b.parserErrorActual !== e.parserErrorActual;
    });
    if (changedCases.length === 0) {
        md += "None — baseline and experimental produced identical output on every case in the frozen corpus.\n";
    } else {
        for (const gt of changedCases) {
            const b = baseScored.find((s) => s.caseId === gt.caseId)!;
            const e = expScored.find((s) => s.caseId === gt.caseId)!;
            md += `- **Case ${gt.caseId}** (\`${gt.file}\`): baseline → ${pairsToStr(b.actual)}; experimental → ${pairsToStr(e.actual)}. Ground truth expects ${pairsToStr(gt.expected ?? [])}. ${gt.rationale}\n`;
        }
    }
    const outPath = path.join(resultsDir, "comparison.md");
    writeFileSync(outPath, md, "utf8");
    console.log(`Wrote ${outPath}`);
}

const mode = process.argv[2];
const groundTruth = loadGroundTruth();

if (mode === "baseline" || mode === "experimental") {
    const results = loadResults(mode);
    const scored = score(groundTruth, results);
    const metrics = computeMetrics(scored);
    writeMetrics(mode, scored, metrics);
} else if (mode === "compare") {
    const baseResults = loadResults("baseline");
    const expResults = loadResults("experimental");
    const baseScored = score(groundTruth, baseResults);
    const expScored = score(groundTruth, expResults);
    const baseMetrics = computeMetrics(baseScored);
    const expMetrics = computeMetrics(expScored);
    writeMetrics("baseline", baseScored, baseMetrics);
    writeMetrics("experimental", expScored, expMetrics);
    writeComparison(groundTruth, baseScored, expScored, baseMetrics, expMetrics);
} else {
    console.error('Usage: score-results.ts <baseline|experimental|compare>');
    process.exit(1);
}
