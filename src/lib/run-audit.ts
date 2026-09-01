import { AuditReport, CategoryResult, AuditCategory } from './types';
import { runLegacyPatternChecks } from './audit-engine';
import { runAnalysis, type Stage } from './analysis/client';
import { countBySeverity } from './analysis/types';
import type { AnalysisMode } from './analysis/analyze';

export interface RunAuditOptions {
    onStage?: (stage: Stage, detail?: string) => void;
}

/**
 * Orchestrates a full analysis: the AST/pattern security engine (run in a
 * Web Worker — see analysis/client.ts) plus the legacy, non-security
 * accessibility/performance/mobile/codeQuality hygiene checks (run
 * synchronously on the main thread; these are a handful of fast regex
 * passes over the same size-capped input, not full AST work, so they are
 * not worker-isolated — see docs/architecture.md for that tradeoff).
 *
 * There used to be a heuristic pre-gate here (audit-engine.ts's old
 * validateInput(): reject anything under 40 characters / 3 lines, or that
 * didn't match a crude "looks like HTML/React/JS" regex) that ran BEFORE
 * the real engine and silently skipped analysis entirely on rejection.
 * That made sense when the underlying engine was itself just regex
 * guessing and needed to be protected from nonsense input — it does not
 * make sense now that there is a real parser: a genuine one-line
 * `el.innerHTML = x` or a short .ts interface file would be rejected by
 * that heuristic and never analyzed at all, which is exactly the "it's
 * not checking my code" failure mode. The real parser's own "empty" /
 * "too-large" / "parse-error" statuses (see analyze.ts) are a strictly
 * better and more honest validator than an arbitrary line-count guess, so
 * the old gate is removed rather than tuned.
 *
 * Returns no grade, no verdict, no "ship it" recommendation of any kind.
 */
export async function runAudit(code: string, mode: AnalysisMode | "auto" = "auto", options: RunAuditOptions = {}): Promise<AuditReport> {
    const timestamp = Date.now();
    const start = performance.now();

    const engineResult = await runAnalysis(code, mode, { onStage: options.onStage });

    if (engineResult.status !== "ok") {
        return {
            status: engineResult.status,
            statusMessage: engineResult.error,
            language: engineResult.language,
            findings: [],
            countsBySeverity: countBySeverity([]),
            categories: {},
            patternSmells: [],
            rawCodeLength: code.length,
            timestamp,
            durationMs: performance.now() - start,
        };
    }

    // Legacy hygiene checks only make sense for markup-shaped input; for
    // pure script mode they would mostly find nothing (no HTML tags to
    // inspect) and are skipped rather than padding the report with
    // "no <img> tags found" noise.
    let categories: Partial<Record<AuditCategory, CategoryResult>> = {};
    let patternSmells: AuditReport["patternSmells"] = [];
    if (engineResult.language === "html") {
        const legacy = runLegacyPatternChecks(code);
        const byCategory: Partial<Record<AuditCategory, CategoryResult>> = {};
        for (const issue of legacy.issues) {
            if (!byCategory[issue.category]) byCategory[issue.category] = { summary: "", issues: [] };
            byCategory[issue.category]!.issues.push(issue);
        }
        for (const cat of Object.keys(byCategory) as AuditCategory[]) {
            const count = byCategory[cat]!.issues.length;
            byCategory[cat]!.summary = count === 0 ? "No issues found." : `${count} issue(s) found.`;
        }
        categories = byCategory;
        patternSmells = legacy.patternSmells;
    }

    return {
        status: "ok",
        language: engineResult.language,
        findings: engineResult.findings,
        countsBySeverity: engineResult.countsBySeverity,
        categories,
        patternSmells,
        rawCodeLength: code.length,
        timestamp,
        durationMs: performance.now() - start,
    };
}
