import type { AnalysisResult } from './analysis/types';
import { redactSecrets } from './analysis/rules/secrets';

// Privacy defaults (see docs/baseline-audit.md findings #8/#9 and the
// project's privacy commitment): nothing is persisted to localStorage
// unless the user explicitly opts in via saveReportLocally(). Raw pasted
// code is never written to localStorage by this module — only report
// metadata (counts, rule IDs, language) and an already-masked excerpt.
//
// This localStorage data is plaintext, like nearly all localStorage usage.
// It is NOT encrypted. We do not claim otherwise anywhere in the app; see
// README "Known limitations".

const REPORT_KEY = 'xaudit:lastReportMeta';
const PREF_KEY = 'xaudit:saveLocallyEnabled';
const MAX_STORAGE_BYTES = 256 * 1024; // metadata-only, so this is generous

export interface StoredReportMeta {
    timestamp: number;
    language: AnalysisResult['language'];
    countsBySeverity: AnalysisResult['countsBySeverity'];
    findingTitles: string[]; // titles only — never raw snippets or secrets
    codeExcerptMasked: string; // built by maskCodeExcerpt() below — first ~120 chars, with vendor-shaped secrets redacted first
}

/**
 * Builds the short excerpt that's safe to persist locally: redact
 * vendor-shaped secrets across the WHOLE input first (not just the slice —
 * a match could straddle where a naive slice-then-redact would cut it),
 * then take the first ~120 characters. Shared by storage.ts and
 * storage/history.ts so this fix lives in exactly one place.
 */
export function maskCodeExcerpt(code: string): string {
    return redactSecrets(code).slice(0, 120).replace(/\s+/g, ' ');
}

function isSafeSize(data: string): boolean {
    try {
        return new Blob([data]).size <= MAX_STORAGE_BYTES;
    } catch {
        return data.length <= MAX_STORAGE_BYTES;
    }
}

export function isSaveLocallyEnabled(): boolean {
    try {
        return localStorage.getItem(PREF_KEY) === 'true';
    } catch {
        return false;
    }
}

export function setSaveLocallyEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(PREF_KEY, enabled ? 'true' : 'false');
        if (!enabled) clearLocalData();
    } catch {
        // localStorage unavailable (private browsing, disabled storage) — no-op
    }
}

/** Only called when the user has explicitly opted in via setSaveLocallyEnabled(true). */
export function saveReportLocally(report: AnalysisResult, rawCode: string): void {
    if (!isSaveLocallyEnabled()) return;
    try {
        const meta: StoredReportMeta = {
            timestamp: report.timestamp,
            language: report.language,
            countsBySeverity: report.countsBySeverity,
            findingTitles: report.findings.map((f) => f.title),
            codeExcerptMasked: maskCodeExcerpt(rawCode),
        };
        const data = JSON.stringify(meta);
        if (!isSafeSize(data)) return;
        localStorage.setItem(REPORT_KEY, data);
    } catch (e) {
        console.error('[XAudit Storage] Failed to save report metadata locally', e);
    }
}

export function loadLatestReportMeta(): StoredReportMeta | null {
    try {
        const data = localStorage.getItem(REPORT_KEY);
        if (!data) return null;
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export function clearLocalData(): void {
    try {
        localStorage.removeItem(REPORT_KEY);
    } catch {
        // no-op
    }
}
