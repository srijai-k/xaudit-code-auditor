import type { AnalysisResult, Finding, Severity } from './analysis/types';

const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

function topFindings(result: AnalysisResult, max = 5): Finding[] {
    return [...result.findings].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]).slice(0, max);
}

/**
 * Builds a plain-text prompt a user can paste into a coding assistant of
 * their choice. This is a static template assembled from the findings this
 * tool already produced — it does not call any AI itself, and does not
 * claim the resulting fix will be correct or complete.
 */
export function generateFixPrompt(result: AnalysisResult, rawCode: string, platform: string): string {
    const findings = topFindings(result);
    const findingsBlock = findings
        .map((f) => `- **[${f.severity.toUpperCase()}] ${f.title}**: ${f.saferExample} (${f.message})`)
        .join('\n');

    const countsLine = Object.entries(result.countsBySeverity)
        .filter(([, count]) => count > 0)
        .map(([severity, count]) => `${count} ${severity}`)
        .join(', ') || 'none';

    let platformInstruction = "";
    switch (platform) {
        case 'ChatGPT':
        case 'Claude':
            platformInstruction = "Please provide the full updated code file and briefly explain what changed and why.";
            break;
        case 'v0':
            platformInstruction = "Treat this as a component refinement. Preserve layout and styling; only change what's needed to address the findings below.";
            break;
        case 'Cursor':
        case 'Windsurf':
            platformInstruction = "Output the fix as a minimal diff/patch — change only the lines needed to address the specific findings.";
            break;
        case 'Bolt':
        case 'Lovable':
            platformInstruction = "Maintain exact UI fidelity. Only modify logic or tags required to address these findings. Do not introduce new dependencies.";
            break;
        default:
            platformInstruction = "Provide the corrected code while keeping the original design and structure intact.";
    }

    return `Review and, where appropriate, fix the following findings from a client-side static pattern checker (XAUDIT). These are pattern matches that require human judgment, not confirmed vulnerabilities — verify each one applies before changing anything.

### Findings summary
${countsLine}

### Findings to review
${findingsBlock || '(No findings were reported for this code.)'}

### Rules
1. Do not rewrite the whole file — change only what's needed to address the findings above.
2. Do not change design, layout, or unrelated logic.
3. ${platformInstruction}

### Code
\`\`\`
${rawCode}
\`\`\`
`;
}
