import type { AnalysisResult, Finding, Severity } from "../analysis/types";

/**
 * SARIF 2.1.0 export — the standard format GitHub Code Scanning, VS Code's
 * SARIF viewer extension, and most CI security tooling can already read.
 * This is a pure data reshape of findings this engine already produced —
 * no new detection logic, so no new false-positive risk.
 *
 * Two deliberate scoping decisions, stated plainly rather than left to
 * guesswork:
 *
 *   1. `artifactLocation.uri` is always the fixed string "pasted-input".
 *      This tool has no real filename — you paste text, it doesn't read a
 *      filesystem — so anything else here would be a fabricated path.
 *   2. There is no per-result "remediation link" (a `helpUri` pointing
 *      somewhere). This project doesn't host stable, deep-linkable
 *      documentation for each individual rule ID, and a fabricated or
 *      generic link would be worse than none — either it goes nowhere
 *      specific or it overstates how tailored the guidance is. Instead,
 *      the actual safer-example text (the same one shown in the app) is
 *      included directly in `properties.saferExample` on every result, so
 *      the remediation guidance travels with the finding either way.
 *
 * `properties["security-severity"]` is GitHub's own documented SARIF
 * extension (a 0.0–10.0 float used to color-code results in its UI) — the
 * mapping below is this project's own approximation, not derived from any
 * CVSS scoring, and is labeled as such.
 */

const SEVERITY_TO_SARIF_LEVEL: Record<Severity, "error" | "warning" | "note"> = {
    critical: "error",
    high: "error",
    medium: "warning",
    low: "note",
    info: "note",
};

// This project's own rough approximation for GitHub's security-severity
// extension field — not a CVSS score, not derived from any external data.
const SEVERITY_TO_SCORE: Record<Severity, number> = {
    critical: 9.5,
    high: 7.5,
    medium: 5.0,
    low: 3.0,
    info: 1.0,
};

interface SarifRuleDescriptor {
    id: string;
    name: string;
    shortDescription: { text: string };
    fullDescription: { text: string };
    defaultConfiguration: { level: "error" | "warning" | "note" };
    properties: Record<string, unknown>;
}

function buildRuleDescriptor(finding: Finding): SarifRuleDescriptor {
    return {
        id: finding.ruleId,
        name: finding.title,
        shortDescription: { text: finding.title },
        fullDescription: { text: finding.whyItMatters },
        defaultConfiguration: { level: SEVERITY_TO_SARIF_LEVEL[finding.severity] },
        properties: {
            category: finding.category,
            "security-severity": String(SEVERITY_TO_SCORE[finding.severity]),
        },
    };
}

export function generateSarif(result: AnalysisResult, toolVersion = "0.1.0"): object {
    const ruleDescriptors = new Map<string, SarifRuleDescriptor>();
    for (const finding of result.findings) {
        if (!ruleDescriptors.has(finding.ruleId)) {
            ruleDescriptors.set(finding.ruleId, buildRuleDescriptor(finding));
        }
    }

    const results = result.findings.map((finding) => ({
        ruleId: finding.ruleId,
        level: SEVERITY_TO_SARIF_LEVEL[finding.severity],
        message: { text: finding.message },
        locations: [
            {
                physicalLocation: {
                    artifactLocation: { uri: "pasted-input" },
                    ...(finding.location
                        ? {
                              region: {
                                  startLine: finding.location.line,
                                  startColumn: finding.location.column + 1, // SARIF columns are 1-based; this engine's are 0-based
                                  ...(finding.location.endLine ? { endLine: finding.location.endLine } : {}),
                                  ...(finding.snippet ? { snippet: { text: finding.snippet } } : {}),
                              },
                          }
                        : {}),
                },
            },
        ],
        properties: {
            severity: finding.severity,
            whyItMatters: finding.whyItMatters,
            saferExample: finding.saferExample,
            limitations: finding.limitations,
        },
    }));

    return {
        $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        version: "2.1.0",
        runs: [
            {
                tool: {
                    driver: {
                        name: "XAUDIT",
                        informationUri: "https://github.com/srijai-k/xaudit-code-auditor",
                        version: toolVersion,
                        rules: [...ruleDescriptors.values()],
                    },
                },
                results,
                properties: {
                    language: result.language,
                    analyzedAt: new Date(result.timestamp).toISOString(),
                    note: "Findings are pattern matches that require human review, not confirmed vulnerabilities. A clean result does not mean this code is secure.",
                },
            },
        ],
    };
}
