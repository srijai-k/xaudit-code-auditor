import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";
import { MAX_SOURCE_BYTES } from "../../src/lib/analysis/types";

describe("unit: analyze() orchestrator", () => {
    it("returns status 'empty' for blank input", () => {
        const result = analyze("   \n  ", "script");
        expect(result.status).toBe("empty");
        expect(result.findings).toHaveLength(0);
    });

    it("returns status 'too-large' above the documented size limit, without attempting to parse", () => {
        const oversized = "const x = 1;\n".repeat(Math.ceil(MAX_SOURCE_BYTES / 13) + 100);
        const result = analyze(oversized, "script");
        expect(result.status).toBe("too-large");
        expect(result.error).toMatch(/KB/);
        expect(result.findings).toHaveLength(0);
    });

    it("returns status 'parse-error' with a location for invalid syntax, and does not throw", () => {
        const broken = "function broken( {{{ not valid js at all +++ ";
        const result = analyze(broken, "script");
        expect(result.status).toBe("parse-error");
        expect(result.error).toBeTruthy();
    });

    it("html mode never runs script rules, and vice versa", () => {
        const htmlDoc = `<!DOCTYPE html><html><head></head><body><img src="x.png"></body></html>`;
        const htmlResult = analyze(htmlDoc, "html");
        expect(htmlResult.language).toBe("html");
        expect(htmlResult.findings.every((f) => f.category === "html")).toBe(true);
    });

    it("auto mode detects HTML documents by content, not by a user-selected label", () => {
        const htmlDoc = `<!DOCTYPE html><html><head></head><body></body></html>`;
        const result = analyze(htmlDoc, "auto");
        expect(result.language).toBe("html");
    });

    it("rulesRun records every script rule that executed, so an obviously-broken rule cannot fail silently", () => {
        const code = `const x = 1;\nconsole.log(x);\n`;
        const result = analyze(code, "script");
        expect(result.rulesRun.map((r) => r.ruleId).sort()).toEqual(
            ["auth", "dynamic-exec", "node-command", "secrets", "sqli", "xss"].sort(),
        );
        expect(result.rulesRun.every((r) => !r.error)).toBe(true);
    });

    it("reports real stage callbacks, not a fixed/fake sequence", () => {
        const stages: string[] = [];
        analyze("const x = 1;\nconsole.log(x);\n", "script", (stage) => stages.push(stage));
        expect(stages).toEqual(["parsing", "analyzing", "rendering"]);
    });

    it("a parse error stops before the 'analyzing' stage ever fires", () => {
        const stages: string[] = [];
        analyze("function broken( {{{ +++", "script", (stage) => stages.push(stage));
        expect(stages).toEqual(["parsing"]);
    });
});
