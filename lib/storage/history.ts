import type { AnalysisResult } from '../analysis/types';
import { isSaveLocallyEnabled, maskCodeExcerpt } from '../storage';

// Privacy default: history is OFF unless the user opts in (see
// storage.ts / setSaveLocallyEnabled). When enabled, only metadata and an
// excerpt are stored — never the full raw pasted code, and the excerpt
// itself goes through maskCodeExcerpt() (storage.ts), which redacts
// vendor-shaped secrets before truncating. That redaction pass was added
// after testing found the excerpt was previously just a raw slice — see
// storage.ts's comment on maskCodeExcerpt for the full story.

export interface AuditHistoryItem {
    id: string;
    createdAt: string;
    language: AnalysisResult['language'];
    countsBySeverity: AnalysisResult['countsBySeverity'];
    findingCount: number;
    codeExcerptMasked: string; // built by maskCodeExcerpt() — see storage.ts
}

const HISTORY_KEY = 'xaudit:auditHistory';
const MAX_HISTORY_ITEMS = 50;

export function saveAuditToHistory(report: AnalysisResult, code: string): string | null {
    if (!isSaveLocallyEnabled()) return null;

    const history = getAuditHistory();
    const id = crypto.randomUUID();

    const item: AuditHistoryItem = {
        id,
        createdAt: new Date(report.timestamp).toISOString(),
        language: report.language,
        countsBySeverity: report.countsBySeverity,
        findingCount: report.findings.length,
        codeExcerptMasked: maskCodeExcerpt(code),
    };

    history.unshift(item);
    const limited = history.slice(0, MAX_HISTORY_ITEMS);

    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
    } catch (e) {
        console.error('Failed to save audit history', e);
    }
    return id;
}

export function getAuditHistory(): AuditHistoryItem[] {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load history', e);
        return [];
    }
}

export function deleteHistoryItem(id: string): void {
    const history = getAuditHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.filter((item) => item.id !== id)));
}

export function clearAuditHistory(): void {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch {
        // no-op
    }
}
