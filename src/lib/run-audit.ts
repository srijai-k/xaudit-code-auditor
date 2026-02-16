import { AuditCategory, AuditReport, CategoryResult, IssueItem, FixItem } from './types';
import { runHeuristicAudit, validateInput, detectFrameworkConfidence } from './audit-engine';
import { calculateGrade, getVerdicts, generateReviewerComment, SEVERITY_POINTS, IMPACT_SCORES, DIFFICULTY_SCORES } from './scoring';
import { scanSecrets } from './security/secret-scanner';
import { detectMaliciousCode } from './security/malicious-detector';

export function runAudit(code: string, mode: "html" | "react" | "javascript" | "auto" = "auto"): AuditReport {
    // 0. Validate Input (Anti-Fake Grading)
    const validation = validateInput(code);
    if (!validation.isValid) {
        return {
            status: "INVALID",
            overallScore: 0,
            grade: { grade: "N/A", capsTriggered: [] },
            statusVerdict: "REJECTED FOR PROD - INVALID INPUT",
            verdict: { portfolio: "NO", client: "NO", saas: "NO" },
            confidence: "LOW",
            summaryText: validation.reason || "Not enough code to audit. Paste a real file or component.",
            categories: {
                accessibility: { score: 0, summary: "Invalid input", issues: [] },
                performance: { score: 0, summary: "Invalid input", issues: [] },
                mobile: { score: 0, summary: "Invalid input", issues: [] },
                security: { score: 0, summary: "Invalid input", issues: [] },
                codeQuality: { score: 0, summary: "Invalid input", issues: [] },
                secrets: { score: 0, summary: "Invalid input", issues: [] }
            },
            topFixes: [],
            aiSmells: [],
            positives: [],
            finalReviewerComment: "AuditX can't grade this because the input doesn't look like real code. Please provide a substantial code snippet.",
            timestamp: Date.now()
        }

        // 0.5 Malicious Code Check (Immediate Rejection)
        const maliciousCheck = detectMaliciousCode(code);
        if (maliciousCheck.found) {
            const criticalCount = maliciousCheck.issues.filter(i => i.severity === 'critical').length;
            if (criticalCount > 0) {
                return {
                    status: "INVALID",
                    overallScore: 0,
                    grade: { grade: "F", capsTriggered: [] },
                    statusVerdict: "BLOCKED - MALICIOUS CODE DETECTED",
                    verdict: { portfolio: "NO", client: "NO", saas: "NO" },
                    confidence: "HIGH",
                    summaryText: "CRITICAL SECURITY RISK: Malicious patterns detected. Deployment block enforced.",
                    categories: {
                        accessibility: { score: 0, summary: "Audit skipped due to security risk", issues: [] },
                        performance: { score: 0, summary: "Audit skipped due to security risk", issues: [] },
                        mobile: { score: 0, summary: "Audit skipped due to security risk", issues: [] },
                        security: {
                            score: 0,
                            summary: "Malicious code detected",
                            issues: maliciousCheck.issues.map(i => ({
                                id: 'sec-malicious-' + Math.random().toString(36).substr(2, 9),
                                category: 'security',
                                title: 'MALICIOUS PATTERN: ' + i.description,
                                severity: 'critical',
                                description: i.description,
                                whyItMatters: 'Malicious code can compromise the entire system.',
                                suggestion: i.fix,
                                snippet: i.pattern
                            }))
                        },
                        codeQuality: { score: 0, summary: "Audit skipped due to security risk", issues: [] },
                        secrets: { score: 0, summary: "Audit skipped due to security risk", issues: [] }
                    },
                    topFixes: [],
                    aiSmells: [],
                    positives: [],
                    finalReviewerComment: "I cannot audit this code. It contains known malicious patterns (e.g. eval, mining, or injection vectors). Remove them immediately.",
                    timestamp: Date.now()
                };
            }
        };
    }

    // 1. Detect mode and Framework Confidence
    let detectedMode = mode;
    if (mode === "auto") {
        if (code.includes('import React') || code.includes('export default function')) detectedMode = "react";
        else if (code.includes('<html') || code.includes('<!DOCTYPE html>')) detectedMode = "html";
        else detectedMode = "javascript";
    }

    const frameworkMatch = detectFrameworkConfidence(code);
    const confidencePenalty = frameworkMatch.isConfident ? 0 : 20;

    // 2. Call audit engine
    const { issues, aiSmells, positives, nestingDepth } = runHeuristicAudit(code, detectedMode);

    // 2.5 New Secret Scan
    const secretsResult = scanSecrets(code);

    // 3. Compute scores per category
    const categories: Record<AuditCategory, CategoryResult> = {
        accessibility: { score: 100, summary: "", issues: [] },
        performance: { score: 100, summary: "", issues: [] },
        mobile: { score: 100, summary: "", issues: [] },
        security: { score: 100, summary: "", issues: [] },
        codeQuality: { score: 100, summary: "", issues: [] },
        secrets: { score: 100, summary: "", issues: [] }
    };

    issues.forEach(issue => {
        if (!categories[issue.category]) {
            return;
        }
        categories[issue.category].issues.push(issue);

        // Base penalty
        let penalty = SEVERITY_POINTS[issue.severity];

        // EXTREME SECURITY MODE OVERRIDES (Strict Senior Reviewer)
        if (issue.category === 'security' || issue.category === 'secrets') {
            if (issue.severity === 'critical') penalty = 85;
            if (issue.severity === 'high') penalty = 50;
            if (issue.severity === 'medium') penalty = 25;

            // Specific Harsh Penalties (Prompt Requirements)
            if (issue.id === 'sec-eval') penalty = 70;
            if (issue.id === 'sec-xss') penalty = 50;
            if (issue.id === 'sec-unknown-script') penalty = 40;
            if (issue.id === 'cq-inline-event') penalty = 15;
            if (issue.id === 'sec-leak-api-key' || issue.id.includes('api-key')) penalty = 90;
            if (issue.id.includes('password') || issue.id.includes('token')) penalty = 80;
            if (issue.id === 'sec-suspicious-fetch') penalty = 40;
            if (issue.id === 'sec-no-csp') penalty = 10;
        } else {
            // Standard Overrides
            if (issue.id === 'mob-viewport') penalty = 65;
            if (issue.id === 'acc-alt') penalty = 60;
        }

        categories[issue.category].score = Math.max(0, categories[issue.category].score - penalty);
    });

    // 3.5 Secrets Category Scoring
    if (secretsResult.found) {
        let penalty = 0;
        secretsResult.items.forEach(s => {
            if (s.severity === 'critical') penalty += 70;
            else if (s.severity === 'high') penalty += 40;
            else penalty += 20;
        });

        categories.secrets.score = Math.max(0, 100 - penalty);
        categories.security.score = Math.min(categories.security.score, categories.secrets.score);

        // Add to main issues list
        secretsResult.items.forEach(s => {
            categories.secrets.issues.push({
                id: `sec-leak-${s.type.toLowerCase().replace(/\s+/g, '-')}`,
                category: 'secrets',
                title: `Exposed ${s.type}`,
                severity: s.severity,
                description: s.riskExplanation,
                whyItMatters: s.riskExplanation,
                suggestion: s.immediateAction,
                snippet: s.previewMasked
            });
        });
    }

    // 3.6 SENIOR SECURITY META-AUDIT (Capping & Penalties)
    // Scanner Coverage Penalty
    if (secretsResult.patternsCount < 10) categories.security.score = Math.min(categories.security.score, 40);
    else if (secretsResult.patternsCount < 20) categories.security.score = Math.min(categories.security.score, 60);
    else if (secretsResult.patternsCount < 50) categories.security.score = Math.min(categories.security.score, 80);

    // Missing Category Penalty
    // (Patterns already expanded in secret-scanner.ts, let's assume they are present if patternsCount > 50)
    if (secretsResult.patternsCount < 50) {
        categories.security.score -= (50 - secretsResult.patternsCount); // 1 point per missing pattern
    }

    // False Confidence Penalty
    const hasIncompleteDetection = secretsResult.items.some(i => !i.confidence || !i.fixPrompt);
    if (hasIncompleteDetection) categories.security.score -= 15;

    categories.security.score = Math.max(0, categories.security.score);
    categories.secrets.score = Math.min(categories.secrets.score, categories.security.score);

    // Apply Framework Confidence Penalty
    if (confidencePenalty > 0) {
        categories.codeQuality.score = Math.max(0, categories.codeQuality.score - confidencePenalty);
        categories.security.score = Math.max(0, categories.security.score - confidencePenalty);
    }

    // Perfection Blockers: Cap at 95 if issues/smells exist
    Object.keys(categories).forEach(cat => {
        const c = cat as AuditCategory;
        if (categories[c].issues.length > 0 && categories[c].score > 95) {
            categories[c].score = 95;
        }
    });

    // Score Realism Caps
    if (aiSmells.length >= 3) categories.codeQuality.score = Math.min(categories.codeQuality.score, 60);
    if (nestingDepth > 10) categories.codeQuality.score = Math.min(categories.codeQuality.score, 70);
    const hasSemanticIssues = categories.accessibility.issues.some(i => i.id === 'acc-main' || i.id === 'cq-no-semantic');
    if (hasSemanticIssues) categories.accessibility.score = Math.min(categories.accessibility.score, 85);

    Object.keys(categories).forEach(cat => {
        const c = cat as AuditCategory;
        const count = categories[c].issues.length;
        if (count === 0) categories[c].summary = "Excellent adherence to standards.";
        else if (count <= 2) categories[c].summary = "Minor improvements needed.";
        else categories[c].summary = `${count} issues detected requiring attention.`;
    });

    // 4. Compute base overall score
    const weightedAverage =
        (categories.accessibility.score * 0.20) +
        (categories.performance.score * 0.25) +
        (categories.mobile.score * 0.20) +
        (categories.security.score * 0.15) +
        (categories.codeQuality.score * 0.20);

    const worstCategoryScore = Math.min(
        categories.accessibility.score,
        categories.performance.score,
        categories.mobile.score,
        categories.security.score,
        categories.codeQuality.score,
        categories.secrets.score
    );

    let overallScore = Math.round((weightedAverage * 0.6) + (worstCategoryScore * 0.4));

    // 5. AI Smell Deductions
    aiSmells.forEach(smell => {
        overallScore -= 5;
        const perfDeduction = smell.severity === 'high' ? 15 : smell.severity === 'medium' ? 10 : 5;
        categories.performance.score = Math.max(0, categories.performance.score - perfDeduction);
        const cqDeduction = smell.severity === 'high' ? 25 : smell.severity === 'medium' ? 20 : 10;
        categories.codeQuality.score = Math.max(0, categories.codeQuality.score - cqDeduction);
    });

    overallScore = Math.max(0, overallScore);

    // 6. Generate verdict + grade
    const catScores = {
        accessibility: categories.accessibility.score,
        performance: categories.performance.score,
        mobile: categories.mobile.score,
        security: categories.security.score,
        codeQuality: categories.codeQuality.score,
        secrets: categories.secrets.score
    };

    const grade = calculateGrade(overallScore, issues, catScores);
    const verdict = getVerdicts({ overallScore, categories });

    // 7. Generate topFixes
    const topFixes = generateTopFixes(issues);

    // 8. Final Comment
    const finalReviewerComment = generateReviewerComment({ overallScore, categories });

    let statusVerdict = undefined;
    if (overallScore < 20 || grade.grade === 'F') {
        statusVerdict = "UNSHIPPABLE - This code fails baseline production standards.";
    }

    return {
        status: "OK",
        overallScore,
        grade,
        verdict,
        statusVerdict,
        confidence: "MEDIUM",
        summaryText: overallScore < 20
            ? `UNSHIPPABLE: Overall code health is ${grade.grade}. This fails baseline production standards.`
            : `Overall code health is ${grade.grade}. Review suggested fixes to reach production standard.`,
        categories,
        topFixes,
        aiSmells,
        positives,
        finalReviewerComment,
        secrets: secretsResult,
        timestamp: Date.now()
    };
}

function generateTopFixes(issues: IssueItem[]): FixItem[] {
    return issues
        .map(issue => {
            const impactScore = IMPACT_SCORES[issue.severity];
            const difficulty: "easy" | "medium" | "hard" = issue.severity === 'low' ? 'easy' : issue.severity === 'critical' ? 'hard' : 'medium';

            const fix: FixItem = {
                title: issue.title,
                impactText: `+${impactScore} ${issue.category.toUpperCase()} POINTS`,
                difficulty: difficulty,
                why: issue.whyItMatters,
                howToFix: issue.suggestion,
                snippet: issue.snippet
            };
            return { fix, impactScore };
        })
        .sort((a, b) => b.impactScore - a.impactScore)
        .slice(0, 3)
        .map(item => item.fix);
}
