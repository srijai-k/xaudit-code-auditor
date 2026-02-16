import { AuditReport } from './types';

const STORAGE_KEY = 'xaudit:lastReport';
const CODE_KEY = 'xaudit:lastCode';

// Security: Cap storage size to prevent DOS/crash
const MAX_STORAGE_BYTES = 2.5 * 1024 * 1024; // 2.5MB

function isSafeSize(data: string): boolean {
    return new Blob([data]).size <= MAX_STORAGE_BYTES;
}

export function saveReport(report: AuditReport): void {
    try {
        const data = JSON.stringify(report);
        const size = new Blob([data]).size;
        console.log(`[XAudit Storage] Attempting to save report. Size: ${(size / 1024).toFixed(2)} KB`);

        if (!isSafeSize(data)) {
            console.error(`[XAudit Storage] Report too large to save safely. Size: ${(size / 1024 / 1024).toFixed(2)} MB, Limit: ${(MAX_STORAGE_BYTES / 1024 / 1024).toFixed(2)} MB`);
            return;
        }
        localStorage.setItem(STORAGE_KEY, data);
        console.log('[XAudit Storage] Report saved successfully.');
    } catch (e) {
        console.error('[XAudit Storage] Failed to save report to local storage', e);
    }
}

export function saveCode(code: string): void {
    try {
        if (!isSafeSize(code)) {
            console.warn('XAudit Security: Code too large to save safely.');
            return;
        }
        localStorage.setItem(CODE_KEY, code);
    } catch (e) {
        console.error('Failed to save code to local storage', e);
    }
}

export function loadLatestReport(): AuditReport | null {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;

        // Basic integrity check
        if (data.includes('<script') || data.includes('javascript:')) {
            console.error('XAudit Security: Corrupted report detected. Clearing storage.');
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return JSON.parse(data);
    } catch (e) {
        console.error('Failed to load report from local storage', e);
        return null;
    }
}

export function loadLastCode(): string {
    const code = localStorage.getItem(CODE_KEY) || '';
    // Prevent loading malicious scripts on startup
    if (code.includes('<script') || code.includes('javascript:')) {
        return '';
    }
    return code;
}
