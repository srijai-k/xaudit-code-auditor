import { AuditCategory, AuditReport, CategoryResult, IssueSeverity, FixDifficulty, IssueItem } from './types';

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface GradeResult {
    grade: Grade;
    capsTriggered: string[];
}

export function calculateGrade(score: number, issues: IssueItem[] = [], categoryScores?: Record<AuditCategory, number>): GradeResult {
    let grade: Grade = "F";
    if (score >= 95) grade = "A+";
    else if (score >= 85) grade = "A";
    else if (score >= 75) grade = "B";
    else if (score >= 65) grade = "C";
    else if (score >= 55) grade = "D";

    const capsTriggered: string[] = [];

    // 1. Secret Leak Rules (EXTREME MODE)
    if (categoryScores && categoryScores.secrets !== undefined) {
        const secretsCategory = categoryScores.secrets;
        const secretsFound = issues.filter(i => i.category === 'secrets');

        // INTEGRATION: Realism Scoring
        // Only trigger "Grade F" or "Critical" caps if the secret is likely REAL (realism >= 60)
        const likelyRealSecrets = secretsFound.filter(i => {
            const realismScore = (i as any).realismScore ?? 100; // Default to 100 if missing
            return realismScore >= 60;
        });

        const hasCriticalRealSecret = likelyRealSecrets.some(i => i.severity === 'critical');

        // Rule: Multiple likely real secrets -> Force F
        if (likelyRealSecrets.length > 1) {
            return { grade: "F", capsTriggered: ["EXTREME SECURITY: Multiple Real Secrets Leaked"] };
        }

        // Rule: Any critical real secret -> Cap at D
        if (hasCriticalRealSecret) {
            if (grade === "A+" || grade === "A" || grade === "B" || grade === "C") {
                grade = "D";
            }
            capsTriggered.push("CRITICAL: Financial Exposure (Max D)");
        }

        // Rule: Any real secret at all -> Max C
        if (likelyRealSecrets.length > 0 && (grade === "A+" || grade === "A" || grade === "B")) {
            grade = "C";
            capsTriggered.push("Security Leak Detected (Max C)");
        }
    }

    // 2. Identify Other Critical Issues for Caps
    const hasEval = issues.some(i => i.id === 'sec-eval' || i.id === 'cq-eval');
    const hasApiKeyArr = issues.some(i => i.id === 'sec-leak' || i.category === 'secrets');
    const hasViewport = issues.some(i => i.id === 'mob-viewport');
    const hasMissingAlt = issues.some(i => i.id === 'acc-alt');
    const hasUnknownScript = issues.some(i => i.id === 'sec-unknown-script');
    const hasDangerHtml = issues.some(i => i.id === 'sec-xss');

    // 3. Multiple Critical Issues Rule
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length >= 2) {
        return { grade: "F", capsTriggered: ["Multiple Critical Issues"] };
    }

    // 4. Category-Based Caps (Mandatory)
    if (categoryScores) {
        if (categoryScores.security < 20) {
            return { grade: "F", capsTriggered: ["Total Security Failure (< 20)"] };
        }
    }

    // 5. Apply Caps (Strict)
    let cappedGrade = grade;

    // missing alt tags -> MAX GRADE = B
    if (hasMissingAlt && (cappedGrade === "A+" || cappedGrade === "A")) {
        cappedGrade = "B";
        capsTriggered.push("Missing Alt Tags (Max B)");
    }

    // missing viewport / exposed key / unknown script -> MAX GRADE = C
    if ((hasViewport || hasApiKeyArr || hasUnknownScript) &&
        (cappedGrade === "A+" || cappedGrade === "A" || cappedGrade === "B")) {
        cappedGrade = "C";
        if (hasViewport) capsTriggered.push("Missing Viewport (Max C)");
        if (hasApiKeyArr) capsTriggered.push("Exposed API Key (Max C)");
        if (hasUnknownScript) capsTriggered.push("Unknown Script Domain (Max C)");
    }

    // eval() / new Function() -> Security -70 + Grade cap D
    if ((hasEval || hasDangerHtml) &&
        (cappedGrade === "A+" || cappedGrade === "A" || cappedGrade === "B" || cappedGrade === "C")) {
        cappedGrade = "D";
        if (hasEval) capsTriggered.push("eval() / new Function() (Max D)");
        if (hasDangerHtml) capsTriggered.push("dangerouslySetInnerHTML (Max D)");
    }

    // API Key pattern match -> -90 + Grade cap F
    const hasLikelyRealSecret = issues.some(i => i.category === 'secrets' && ((i as any).realismScore ?? 100) >= 60);

    if (hasLikelyRealSecret && cappedGrade !== "F") {
        cappedGrade = "F";
        capsTriggered.push("CRITICAL: Exposed API Secret (Max F)");
    }

    // Score-based Category Caps
    if (categoryScores) {
        if (categoryScores.security < 40 && cappedGrade !== "F" && cappedGrade !== "D") {
            cappedGrade = "D";
            capsTriggered.push("Weak Security (Max D)");
        }
        if (categoryScores.codeQuality < 30 && cappedGrade !== "F" && cappedGrade !== "D") {
            cappedGrade = "D";
            capsTriggered.push("Low Code Quality Score (Max D)");
        }
    }

    return { grade: cappedGrade, capsTriggered };
}

export const SEVERITY_POINTS: Record<IssueSeverity, number> = {
    low: 3,
    medium: 8,
    high: 15,
    critical: 25
};

export function getVerdicts(report: Partial<AuditReport>): AuditReport['verdict'] {
    const { overallScore = 0, categories } = report;
    if (!categories) return { portfolio: "NO", client: "NO", saas: "NO" };

    const acc = categories.accessibility.score;
    const sec = categories.security.score;

    const allIssues = Object.values(categories).flatMap(c => c.issues);
    const worstIssueSeverity = allIssues.reduce((max, issue) => {
        const levels: Record<IssueSeverity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
        return levels[issue.severity] > levels[max] ? issue.severity : max;
    }, 'low' as IssueSeverity);

    const hasHighOrCritical = worstIssueSeverity === 'high' || worstIssueSeverity === 'critical';
    const aiSmellsCount = (report as any).aiSmells?.length || 0;

    // Approved for Prod Rules (Extreme Mode)
    let isApproved = overallScore >= 85 && sec >= 90 && acc >= 80 && !hasHighOrCritical && aiSmellsCount <= 1;

    let saas: "YES" | "RISKY" | "NO" = isApproved ? "YES" : (overallScore > 70 ? "RISKY" : "NO");
    let client: "YES" | "RISKY" | "NO" = overallScore > 80 && sec > 80 ? "YES" : (overallScore > 60 ? "RISKY" : "NO");
    let portfolio: "YES" | "RISKY" | "NO" = overallScore > 60 ? "YES" : "NO";

    return { portfolio, client, saas };
}

export function generateReviewerComment(report: Partial<AuditReport>): string {
    const { overallScore = 0, categories } = report;
    if (!categories) return "Wait, where's the code? Audit failed.";

    const lowest = Object.entries(categories).reduce((a, b) => a[1].score < b[1].score ? a : b);
    const lowestCat = lowest[0] as AuditCategory;
    const sec = categories.security.score;

    if (overallScore > 90) {
        return "Clean, safe, and professional work. This meets senior engineering standards. Approved for production shipment.";
    }

    if (overallScore > 80) {
        return "This is solid, but a few 'vibe-coding' habits are showing. Clean up the remaining nits to hit that production-ready badge.";
    }

    if (overallScore > 60) {
        return "This is fine for a demo, but don't ship this. You're relying on AI scaffolding too heavily and the structural quality is lacking.";
    }

    if (sec < 40) {
        return "UNSHIPPABLE - Security is not acceptable. You have critical leaks or unsafe execution patterns that would fail any professional audit.";
    }

    return "Audit Rejected. This code fails baseline production standards. Rebuild focusing on security and semantic structure.";
}

export const IMPACT_SCORES: Record<IssueSeverity, number> = {
    low: 5,
    medium: 10,
    high: 20,
    critical: 40
};

export const DIFFICULTY_SCORES: Record<FixDifficulty, number> = {
    easy: 5,
    medium: 15,
    hard: 30
};
