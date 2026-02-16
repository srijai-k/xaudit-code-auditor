import { AuditReport } from './types';

export function generateFixPrompt(report: AuditReport, rawCode: string, platform: string): string {
    const topFixes = (report.topFixes || []).map(f => `- **${f.title}**: ${f.howToFix} (Effect: ${f.impactText})`).join('\n');
    const categoriesLine = report.categories ? Object.entries(report.categories)
        .map(([name, cat]) => `${name}: ${cat.score}/100`)
        .join(', ') : 'N/A';

    let platformInstruction = "";

    switch (platform) {
        case 'ChatGPT':
        case 'Claude':
            platformInstruction = "Please provide the full updated code file. Briefly explain the major security or accessibility improvements made.";
            break;
        case 'v0':
            platformInstruction = "Please treat this as a component refinement. Preserve all layout and styling exactness while fixing these production issues. Provide the updated component code.";
            break;
        case 'Cursor':
        case 'Windsurf':
            platformInstruction = "Please output the fix in a way that is easy to apply as a minimal diff or patch. Ensure only necessary lines are changed to fix the specific issues while keeping everything else identical.";
            break;
        case 'Bolt':
        case 'Lovable':
            platformInstruction = "Maintain exact UI fidelity. Only modify the logic or tags required to clear the audit warnings. Do not introduce new dependencies.";
            break;
        default:
            platformInstruction = "Provide the corrected code while keeping the original design and structure intact.";
    }

    return `You are a senior frontend engineer. Fix my AI-generated code based on professional auditing standards.

### Audit Summary
- **Current Grade**: ${report.grade} (${report.overallScore}/100)
- **Category Breakdown**: ${categoriesLine}

### Required Fixes
${topFixes}

### Strict Engineering Rules
1. **DO NOT** rewrite the entire project.
2. **DO NOT** change the design, colors, or layout unless strictly required for a fix (e.g., responsive meta).
3. **ONLY** modify the lines necessary to resolve the issues.
4. Keep the component structure identical to the original where possible.
5. ${platformInstruction}

### Original Code
\`\`\`
${rawCode}
\`\`\`

Tip: paste this into your vibe-coding tool and replace the output file.`;
}
