import { AuditReport } from '../types';

export interface AuditHistoryItem {
    id: string;
    createdAt: string; // ISO string
    grade: string;
    overallScore: number;
    categoryScores: Record<string, number>;
    codeSnippet: string;
    language: string;
    report: AuditReport;
}

const HISTORY_KEY = 'xaudit:auditHistory';

export function saveAudit(report: AuditReport, code: string, language: string): string {
    const history = getAuditHistory();
    const id = crypto.randomUUID();

    const item: AuditHistoryItem = {
        id,
        createdAt: new Date().toISOString(),
        grade: typeof report.grade === 'string' ? report.grade : (report.grade as any).grade,
        overallScore: report.overallScore,
        categoryScores: Object.entries(report.categories).reduce((acc, [key, val]) => {
            acc[key] = val.score;
            return acc;
        }, {} as Record<string, number>),
        codeSnippet: code.substring(0, 120),
        language,
        report
    };

    history.unshift(item); // Newest at top

    // Keep last 50 audits to avoid localStorage bloat
    const limitedHistory = history.slice(0, 50);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
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

export function getAuditById(id: string): AuditHistoryItem | null {
    const history = getAuditHistory();
    return history.find(item => item.id === id) || null;
}

export function deleteAudit(id: string): void {
    const history = getAuditHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export function clearAudits(): void {
    localStorage.removeItem(HISTORY_KEY);
}
