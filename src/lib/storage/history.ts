import { AuditReport } from '../types';
import { isSaveLocallyEnabled } from '../storage';

// Privacy default: history is OFF unless the user opts in (see
// storage.ts / setSaveLocallyEnabled). When enabled, only metadata and a
// masked excerpt are stored — never the raw pasted code, and never an
// unmasked finding snippet (secret findings are already masked at the rule
// level before they ever reach this file).

export interface AuditHistoryItem {
    id: string;
    createdAt: string;
    language: AuditReport['language'];
    countsBySeverity: AuditReport['countsBySeverity'];
    findingCount: number;
    codeExcerptMasked: string;
}

const HISTORY_KEY = 'xaudit:auditHistory';
const MAX_HISTORY_ITEMS = 50;

export function saveAuditToHistory(report: AuditReport, code: string): string | null {
    if (!isSaveLocallyEnabled()) return null;

    const history = getAuditHistory();
    const id = crypto.randomUUID();

    const item: AuditHistoryItem = {
        id,
        createdAt: new Date(report.timestamp).toISOString(),
        language: report.language,
        countsBySeverity: report.countsBySeverity,
        findingCount: report.findings.length,
        codeExcerptMasked: code.slice(0, 120).replace(/\s+/g, ' '),
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
