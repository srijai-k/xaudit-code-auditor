export type AuditCategory = "accessibility" | "performance" | "mobile" | "security" | "codeQuality" | "secrets";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type FixDifficulty = "easy" | "medium" | "hard";

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

export interface FixItem {
    title: string;
    impactText: string;
    difficulty: FixDifficulty;
    why: string;
    howToFix: string;
    snippet?: string;
}

export interface SmellItem {
    title: string;
    severity: IssueSeverity;
    explanation: string;
    suggestion: string;
}

export interface CategoryResult {
    score: number;
    summary: string;
    issues: IssueItem[];
}

export interface AuditReport {
    status: "OK" | "INVALID";
    overallScore: number;
    grade: {
        grade: "A+" | "A" | "B" | "C" | "D" | "F" | "N/A";
        capsTriggered: string[];
    };
    statusVerdict?: string;
    verdict: {
        portfolio: "YES" | "RISKY" | "NO";
        client: "YES" | "RISKY" | "NO";
        saas: "YES" | "RISKY" | "NO";
    };
    confidence: "HIGH" | "MEDIUM" | "LOW";
    summaryText: string;
    categories: Record<AuditCategory, CategoryResult>;
    topFixes: FixItem[];
    aiSmells: SmellItem[];
    positives: string[];
    finalReviewerComment: string;
    timestamp: number;
    // New Secret Leak Protection Data
    secrets?: {
        found: boolean;
        count: number;
        items: {
            type: string;
            severity: "critical" | "high" | "medium";
            confidence: "high" | "medium" | "low";
            line?: number;
            previewMasked: string;
            riskExplanation: string;
            immediateAction: string;
            fixPrompt: string;
            // Realism fields
            isLikelyReal: boolean;
            realismScore: number;
            reasoning: string[];
            confidenceLabel: string;
        }[];
        moneyRiskScore: number;
    };
}
