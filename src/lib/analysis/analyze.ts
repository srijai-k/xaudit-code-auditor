import { parseSource } from "./parse";
import { dedupeFindings } from "./dedupe";
import { runHtmlChecks } from "./rules/html";
import { xssRule } from "./rules/xss";
import { dynamicExecRule } from "./rules/dynamic-exec";
import { sqliRule } from "./rules/sqli";
import { secretsRule } from "./rules/secrets";
import { nodeCommandRule } from "./rules/node-command";
import { authRule } from "./rules/auth";
import { countBySeverity, MAX_SOURCE_BYTES, type AnalysisResult, type Language, type RuleRunSummary } from "./types";
import type { Rule } from "./rule";

export type AnalysisMode = "html" | "script";

/** Real, not simulated: called at the actual point each stage begins. */
export type Stagelistener = (stage: "parsing" | "analyzing" | "rendering", detail?: string) => void;

const SCRIPT_RULES: Rule[] = [xssRule, dynamicExecRule, sqliRule, secretsRule, nodeCommandRule, authRule];

function byteLength(str: string): number {
    return new TextEncoder().encode(str).length;
}

function detectMode(code: string, requested: AnalysisMode | "auto"): AnalysisMode {
    if (requested !== "auto") return requested;
    const trimmed = code.trim();
    return /^<!doctype html/i.test(trimmed) || /<html[\s>]/i.test(trimmed) ? "html" : "script";
}

/**
 * The single analysis entry point. Runs inside the Web Worker (see
 * worker.ts) and is also imported directly by tests — it never touches the
 * network, the DOM, or localStorage. Pure function: (code, mode) -> result.
 */
export function analyze(code: string, requestedMode: AnalysisMode | "auto" = "auto", onStage?: Stagelistener): AnalysisResult {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const timestamp = Date.now();

    if (code.trim().length === 0) {
        return {
            status: "empty",
            language: "unknown",
            findings: [],
            countsBySeverity: countBySeverity([]),
            rulesRun: [],
            durationMs: 0,
            truncated: false,
            timestamp,
        };
    }

    const size = byteLength(code);
    const truncated = false; // this engine rejects over-limit input outright rather than truncating it
    const source = code;
    if (size > MAX_SOURCE_BYTES) {
        return {
            status: "too-large",
            language: "unknown",
            findings: [],
            countsBySeverity: countBySeverity([]),
            rulesRun: [],
            durationMs: 0,
            truncated: true,
            error: `Input is ${(size / 1024).toFixed(0)} KB, which is over the ${MAX_SOURCE_BYTES / 1024} KB analysis limit. Paste a smaller excerpt.`,
            timestamp,
        };
    }

    const mode = detectMode(source, requestedMode);
    const rulesRun: RuleRunSummary[] = [];

    if (mode === "html") {
        onStage?.("parsing", "scanning markup");
        onStage?.("analyzing", "1 rule set (HTML hygiene)");
        const findings = dedupeFindings(runHtmlChecks(source));
        rulesRun.push({ ruleId: "html" });
        onStage?.("rendering");
        return {
            status: "ok",
            language: "html",
            findings,
            countsBySeverity: countBySeverity(findings),
            rulesRun,
            durationMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - start,
            truncated,
            timestamp,
        };
    }

    onStage?.("parsing", "building AST (Babel parser: JS/TS/JSX)");
    const parseResult = parseSource(source);
    if (!parseResult.ok) {
        return {
            status: "parse-error",
            language: "unknown",
            findings: [],
            countsBySeverity: countBySeverity([]),
            rulesRun: [],
            durationMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - start,
            truncated,
            error: parseResult.location
                ? `Could not parse this as JavaScript/TypeScript/JSX: ${parseResult.error} (line ${parseResult.location.line}, column ${parseResult.location.column})`
                : `Could not parse this as JavaScript/TypeScript/JSX: ${parseResult.error}`,
            timestamp,
        };
    }

    const language: Language = /<\w/.test(source) && /return\s*\(/.test(source) ? "jsx" : /:\s*(string|number|boolean|void|unknown|any)\b/.test(source) ? "typescript" : "javascript";

    onStage?.("analyzing", `${SCRIPT_RULES.length} rules (xss, dynamic-exec, sqli, secrets, node-command)`);
    let allFindings: ReturnType<Rule["run"]> = [];
    for (const rule of SCRIPT_RULES) {
        try {
            const findings = rule.run({ ast: parseResult.ast, code: source });
            allFindings = allFindings.concat(findings);
            rulesRun.push({ ruleId: rule.id });
        } catch (err) {
            rulesRun.push({ ruleId: rule.id, error: err instanceof Error ? err.message : String(err) });
        }
    }

    const findings = dedupeFindings(allFindings);
    onStage?.("rendering");

    return {
        status: "ok",
        language,
        findings,
        countsBySeverity: countBySeverity(findings),
        rulesRun,
        durationMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - start,
        truncated,
        timestamp,
    };
}
