import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";
import { redactSecrets } from "../../src/lib/analysis/rules/secrets";

/**
 * There is no timeout anywhere in the analysis pipeline (client.ts's own
 * doc comment: "the worker does not preempt mid-parse"; CheckerPage.jsx
 * just `await`s runAnalysis with nothing wrapping it). If any rule's
 * regex or traversal had catastrophic-backtracking or quadratic behavior,
 * a real user pasting adversarial-but-plausible input would see the UI
 * hang indefinitely with no error and no recovery path except a page
 * refresh — a genuine reliability gap, distinct from and worse than any
 * detection-quality miss.
 *
 * Checked empirically (not assumed) against the most plausible risk
 * points in this codebase, all near the 500KB input cap:
 *   - secrets.ts's redactNameContextAssignments() uses a backreference-
 *     based "(?:(?!\1).)+" pattern — the classic shape that causes
 *     catastrophic backtracking in some regex engines when no closing
 *     quote is ever found. V8 does not backtrack catastrophically on it
 *     in practice, but that's a fact about V8's regex engine today, not
 *     a guarantee — this test exists so a future change (a modified
 *     regex, a different JS engine via some future runtime target) that
 *     reintroduces real catastrophic behavior fails a test, not silently
 *     ships.
 *   - Deep AST nesting (arrays, call chains) — Babel's traverse is
 *     recursive; a sufcifiently deep tree could exhaust the JS call stack.
 *   - A file with thousands of genuine findings — stresses per-node rule
 *     matching and dedup at realistic worst-case scale, not a
 *     contrived single input.
 *
 * Every case here passed in single-digit-to-low-hundreds of milliseconds
 * when this was written. The generous 5-second budget is deliberately
 * loose — this test exists to catch "someone introduced O(n^2) or
 * catastrophic backtracking," not to enforce a specific performance
 * target.
 */
describe("regression: no pathological slowdown near the input size cap", () => {
    const BUDGET_MS = 5000;

    it("redactSecrets() stays fast on an adversarial near-miss for the backreference-based name-context pattern", () => {
        const adversarial = 'const TOKEN = "' + "a".repeat(480_000);
        const start = Date.now();
        redactSecrets(adversarial);
        expect(Date.now() - start).toBeLessThan(BUDGET_MS);
    });

    it("analyze() stays fast on a large valid file with thousands of genuine findings", () => {
        // Built via an array + one join, and length-checked with the
        // native (O(1)) string .length rather than re-encoding the whole
        // growing string every iteration — an earlier version of this
        // test called `new TextEncoder().encode(code).length` inside the
        // loop condition, which is itself an O(n^2) trap (each check
        // re-scans the entire string so far). That bug lived in the TEST,
        // not the product: it made this test appear to take 3+ seconds
        // and a sibling test time out entirely, when analyze() itself
        // (timed correctly, starting only after string construction) was
        // actually fast the whole time — verified separately via a
        // standalone script before concluding either way. All content
        // here is pure ASCII, so .length (UTF-16 code units) equals the
        // UTF-8 byte count exactly.
        const parts: string[] = [];
        let i = 0;
        let len = 0;
        while (len < 480_000) {
            const line = `function f${i}(userInput${i}) { el.innerHTML = userInput${i}; }\n`;
            parts.push(line);
            len += line.length;
            i++;
        }
        const code = parts.join("");
        const start = Date.now();
        const result = analyze(code, "script");
        const elapsed = Date.now() - start;
        expect(result.status).toBe("ok");
        expect(result.findings.length).toBeGreaterThan(1000);
        expect(elapsed).toBeLessThan(BUDGET_MS);
    });

    it("analyze() does not hang or crash on a deeply nested array literal", () => {
        const nested = "const x = " + "[".repeat(20_000) + "1" + "]".repeat(20_000) + ";";
        const start = Date.now();
        expect(() => analyze(nested, "script")).not.toThrow();
        expect(Date.now() - start).toBeLessThan(BUDGET_MS);
    });

    it("analyze() does not hang or crash on a deeply nested function-call chain", () => {
        const nested = "f(".repeat(10_000) + "1" + ")".repeat(10_000) + ";";
        const start = Date.now();
        expect(() => analyze(nested, "script")).not.toThrow();
        expect(Date.now() - start).toBeLessThan(BUDGET_MS);
    });

    it("analyze() stays fast on a single-line HTML file with thousands of tags", () => {
        const TAG = '<img src="a.png">';
        const count = Math.ceil(470_000 / TAG.length);
        const html = "<!DOCTYPE html><html><body>" + TAG.repeat(count) + "</body></html>";
        const start = Date.now();
        const result = analyze(html, "html");
        expect(result.status).toBe("ok");
        expect(Date.now() - start).toBeLessThan(BUDGET_MS);
    });
});
