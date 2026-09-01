import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

/**
 * Regression test for a real bug found during manual verification: an old
 * heuristic pre-gate (audit-engine.ts's former validateInput()) rejected
 * any input under 40 characters / 3 lines / not matching a crude "looks
 * like HTML/React/JS" regex, and skipped real analysis entirely on
 * rejection - even for genuinely valid, short, dangerous code. This is
 * exactly the "it's not checking the code" failure a user hit live.
 *
 * The gate has been removed (see run-audit.ts). The real parser's
 * empty/too-large/parse-error outcomes are the validator now.
 */
describe("regression: short but valid, dangerous one-liners are actually analyzed", () => {
    it("a single-line, single-statement innerHTML assignment is analyzed, not rejected", () => {
        const code = "el.innerHTML = location.hash;";
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "xss-inner-html")).toBe(true);
    });

    it("a short eval() call under the old 40-character minimum is still analyzed", () => {
        const code = "eval(x);"; // 8 characters — well under the old 40-char gate
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "exec-eval")).toBe(true);
    });

    it("a single short line (under the old 3-line minimum) is still analyzed", () => {
        const code = "db.query(\"SELECT * FROM u WHERE id = \" + id)";
        expect(code.split("\n").length).toBe(1); // confirms this would have failed the old line-count gate
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "sqli-dynamic-query")).toBe(true);
    });

    it("only truly empty/whitespace-only input is rejected, not short-but-real code", () => {
        expect(analyze("", "script").status).toBe("empty");
        expect(analyze("   \n\t  ", "script").status).toBe("empty");
        expect(analyze("const x = 1;", "script").status).toBe("ok");
    });
});
