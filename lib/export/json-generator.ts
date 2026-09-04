import type { AnalysisResult } from "../analysis/types";

/**
 * Plain JSON export — the full AnalysisResult (every finding's ruleId,
 * severity, message, whyItMatters, saferExample, limitations, location,
 * and masked snippet; plus which rules actually ran and the detected
 * language) wrapped with a tool identifier and the same disclaimer shown
 * everywhere else in the app. No reshaping of the findings themselves —
 * this is what the app already computed, not a second interpretation of
 * it, so it carries no additional false-positive risk of its own.
 */
export function generateJsonExport(result: AnalysisResult, toolVersion = "0.1.0"): object {
    return {
        tool: "XAUDIT",
        toolVersion,
        disclaimer: "Findings are pattern matches that require human review, not confirmed vulnerabilities. A clean result does not mean this code is secure.",
        exportedAt: new Date().toISOString(),
        result,
    };
}
