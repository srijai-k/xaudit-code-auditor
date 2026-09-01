import type { Finding, Severity } from "./analysis/types";

// NOTE: this file used to define a graded AuditReport (letter grade,
// portfolio/client/saas "ship" verdict, a hardcoded "confidence" field).
// That has been removed — see docs/baseline-audit.md finding #14 and
// docs/scoring-removed.md for why a regex/AST pattern-matcher cannot
// honestly produce a security "grade". This type now reports counts and
// findings only.

export type AuditCategory = "accessibility" | "performance" | "mobile" | "codeQuality";
export type IssueSeverity = Severity;

/** Legacy, non-security hygiene checks (regex-based, explicitly not AST). */
export interface IssueItem {
    id: string;
    category: AuditCategory;
    title: string;
    severity: IssueSeverity;
    description: string;
    whyItMatters: string;
    suggestion: string;
    snippet?: string;
}

export interface CategoryResult {
    summary: string;
    issues: IssueItem[];
}

export interface PatternSmell {
    title: string;
    severity: IssueSeverity;
    explanation: string;
    suggestion: string;
}

export interface AuditReport {
    status: "ok" | "invalid" | "parse-error" | "too-large" | "empty";
    /** Present only for non-"ok" statuses. */
    statusMessage?: string;
    language: "javascript" | "typescript" | "jsx" | "html" | "unknown";

    /** Findings from the AST/pattern security rules (rule groups A-E). Source of truth for severity counts. */
    findings: Finding[];
    countsBySeverity: Record<Severity, number>;

    /** Legacy, non-security hygiene categories (accessibility/performance/mobile/codeQuality). HTML mode only. */
    categories: Partial<Record<AuditCategory, CategoryResult>>;
    /** Renamed from the old "aiSmells" — these are boilerplate/structural pattern observations, not AI-detected. */
    patternSmells: PatternSmell[];

    rawCodeLength: number;
    timestamp: number;
    durationMs: number;
}
