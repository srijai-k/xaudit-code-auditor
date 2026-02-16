export const RATE_LIMIT_CONFIG = {
    LIMIT: 10,
    WINDOW: 3600000, // 1 hour
    CLEANUP_INTERVAL: 600000 // 10 minutes
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Auto-cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (record.resetAt < now) {
            rateLimitMap.delete(key);
        }
    }
}, RATE_LIMIT_CONFIG.CLEANUP_INTERVAL);

export function checkRateLimit(clientId: string = 'local-session'): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    waitMinutes?: number;
} {
    const now = Date.now();
    const record = rateLimitMap.get(clientId);

    // Expired?
    if (record && record.resetAt < now) {
        rateLimitMap.delete(clientId);
    }

    if (!record || record.resetAt < now) {
        rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_CONFIG.WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_CONFIG.LIMIT - 1, resetAt: now + RATE_LIMIT_CONFIG.WINDOW };
    }

    if (record.count >= RATE_LIMIT_CONFIG.LIMIT) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetAt,
            waitMinutes: Math.ceil((record.resetAt - now) / 60000)
        };
    }

    record.count++;
    return {
        allowed: true,
        remaining: RATE_LIMIT_CONFIG.LIMIT - record.count,
        resetAt: record.resetAt
    };
}
