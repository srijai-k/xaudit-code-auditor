// Core types for the AST-based analysis engine.
// These replace the old grade/verdict-shaped AuditReport. Nothing here computes
// a "score" or a pass/fail verdict — the engine only produces a list of
// findings plus counts. See docs/scoring-removed.md for why.

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type RuleCategory =
    | "xss"
    | "dynamic-exec"
    | "sqli"
    | "secrets"
    | "node-command"
    | "auth"
    | "html";

export type Language = "javascript" | "typescript" | "jsx" | "html" | "unknown";

export interface SourceLocation {
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
}

export interface Finding {
    /** Stable rule identifier, e.g. "xss-inner-html". Never reused across rules. */
    ruleId: string;
    title: string;
    severity: Severity;
    category: RuleCategory;
    /** One-sentence, non-alarmist description of exactly what pattern matched. */
    message: string;
    /** Why this matters, phrased as a pattern-match limitation, not a certainty. */
    whyItMatters: string;
    /** A concrete safer alternative for this exact pattern. */
    saferExample: string;
    /** What this rule does NOT prove or cannot see. Always present. */
    limitations: string;
    location?: SourceLocation;
    /**
     * Truncated / masked source excerpt. Rules MUST mask secret values before
     * putting anything here — see rules/secrets.ts maskSecret().
     */
    snippet?: string;
}

export interface RuleRunSummary {
    ruleId: string;
    /** Rules never throw silently; if a rule fails, it's recorded here, not swallowed. */
    error?: string;
}

export interface AnalysisResult {
    status: "ok" | "parse-error" | "too-large" | "empty";
    language: Language;
    findings: Finding[];
    countsBySeverity: Record<Severity, number>;
    rulesRun: RuleRunSummary[];
    durationMs: number;
    /** True if the input was cut off at the size limit before analysis ran. */
    truncated: boolean;
    /** Present only when status is "parse-error" or "too-large". */
    error?: string;
    timestamp: number;
}

export const EMPTY_SEVERITY_COUNTS: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
};

export function countBySeverity(findings: Finding[]): Record<Severity, number> {
    const counts = { ...EMPTY_SEVERITY_COUNTS };
    for (const f of findings) counts[f.severity]++;
    return counts;
}

/** Hard cap enforced before any parsing happens. Documented, tested, not a guess. */
export const MAX_SOURCE_BYTES = 500 * 1024; // 500 KB
