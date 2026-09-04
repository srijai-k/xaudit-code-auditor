import { describe, it, expect } from "vitest";
import { runHtmlChecks } from "../../src/lib/analysis/rules/html";
import { analyze } from "../../src/lib/analysis/analyze";

describe("unit: HTML hygiene checks (attribute-based, not AST, not security-grade)", () => {
    it("flags a missing viewport meta tag on a full document", () => {
        const html = `<!DOCTYPE html><html><head><title>x</title></head><body></body></html>`;
        const findings = runHtmlChecks(html);
        expect(findings.some((f) => f.ruleId === "html-missing-viewport")).toBe(true);
    });

    it("does not flag viewport when present", () => {
        const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>`;
        const findings = runHtmlChecks(html);
        expect(findings.some((f) => f.ruleId === "html-missing-viewport")).toBe(false);
    });

    it("flags images missing alt text", () => {
        const html = `<!DOCTYPE html><html><body><img src="a.png"><img src="b.png" alt="a real description"></body></html>`;
        const findings = runHtmlChecks(html);
        const finding = findings.find((f) => f.ruleId === "html-missing-alt");
        expect(finding).toBeDefined();
        expect(finding?.message).toContain("1 of 2");
    });

    it("never treats JSX onClick={...} as an inline HTML event handler (this module only runs on markup, never on JSX source, but the regex itself is also quote-anchored)", () => {
        const jsxLike = `<button onClick={handleClick}>Go</button>`;
        const findings = runHtmlChecks(jsxLike);
        expect(findings.some((f) => f.ruleId === "html-inline-event-handler")).toBe(false);
    });

    it("flags a real inline HTML event handler with a literal quote", () => {
        const html = `<button onclick="doStuff()">Go</button>`;
        const findings = runHtmlChecks(html);
        expect(findings.some((f) => f.ruleId === "html-inline-event-handler")).toBe(true);
    });

    it("every finding tops out at medium severity — this is a hygiene check, not a vulnerability scanner", () => {
        const html = `<!DOCTYPE html><html><body><img src="a.png"><button onclick="x()"></button></body></html>`;
        const findings = runHtmlChecks(html);
        expect(findings.every((f) => f.severity === "medium" || f.severity === "low" || f.severity === "info")).toBe(true);
    });
});

// F-05, docs/self-audit-2026-09-03.md: HTML mode used to return a silent,
// clean report for input with real, unanalyzed script content. It's now
// partly closed — analyze() extracts inline <script> blocks and runs the
// five real rules against whichever ones parse on their own. These tests
// exercise the real, end-user-visible behavior via analyze(), since the
// orchestration (parse attempt, per-block real-rules-or-disclosure,
// line-number remapping) lives there now, not in runHtmlChecks() alone.
describe("regression + feature: HTML mode now analyzes parseable inline <script> content (F-05)", () => {
    it("a <script> block that parses on its own surfaces a REAL finding from the actual rules, not just a disclosure", () => {
        const html = `<!DOCTYPE html>\n<html>\n<body>\n<script>\nfunction leak() {\n  return eval(location.hash);\n}\n</script>\n</body>\n</html>`;
        const result = analyze(html, "html");
        expect(result.status).toBe("ok");
        const evalFinding = result.findings.find((f) => f.ruleId === "exec-eval");
        expect(evalFinding).toBeDefined();
        // Never both — a block that produced a real finding must not also
        // carry the "not analyzed" disclosure for that same block.
        expect(result.findings.some((f) => f.ruleId === "html-script-content-not-analyzed")).toBe(false);
    });

    it("remaps the real finding's line number back to its actual position in the original document, not line 1 of the extracted snippet", () => {
        const html = `<!DOCTYPE html>\n<html>\n<body>\n<script>\nfunction leak() {\n  return eval(location.hash);\n}\n</script>\n</body>\n</html>`;
        const result = analyze(html, "html");
        const evalFinding = result.findings.find((f) => f.ruleId === "exec-eval");
        // The eval() call sits on line 6 of the document above (1-indexed),
        // not line 2 of the script block's own content.
        expect(evalFinding?.location?.line).toBe(6);
    });

    it("a <script> block that cannot parse on its own (relies on surrounding template syntax) still gets the honest per-block disclosure", () => {
        const html = `<!DOCTYPE html>\n<html>\n<body>\n<script>\n<% if (user) { %>\nconst greeting = "hi";\n<% } %>\n</script>\n</body>\n</html>`;
        const result = analyze(html, "html");
        const disclosure = result.findings.find((f) => f.ruleId === "html-script-content-not-analyzed");
        expect(disclosure).toBeDefined();
        expect(disclosure?.severity).toBe("info");
    });

    it("analyzes multiple <script> blocks independently — one parseable with a real bug, one that isn't", () => {
        const html = [
            "<!DOCTYPE html><html><body>",
            "<script>const key = \"sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR\";</script>",
            "<script><% broken template only %></script>",
            "</body></html>",
        ].join("\n");
        const result = analyze(html, "html");
        expect(result.findings.some((f) => f.ruleId === "secret-openai")).toBe(true);
        expect(result.findings.some((f) => f.ruleId === "html-script-content-not-analyzed")).toBe(true);
    });

    it("does not attempt to parse a non-executable script type (application/json) as JavaScript", () => {
        const html = `<!DOCTYPE html><html><body><script type="application/json">{"eval": "not code"}</script></body></html>`;
        const result = analyze(html, "html");
        expect(result.findings.some((f) => f.ruleId === "exec-eval")).toBe(false);
        expect(result.findings.some((f) => f.ruleId === "html-script-content-not-analyzed")).toBe(false);
    });

    it("does not flag an external <script src=\"...\"> — there is no inline content to miss", () => {
        const html = `<!DOCTYPE html><html><head></head><body><script src="/app.js"></script></body></html>`;
        const result = analyze(html, "html");
        expect(result.findings.some((f) => f.ruleId === "html-script-content-not-analyzed")).toBe(false);
    });

    it("does not flag an empty/whitespace-only inline <script> block", () => {
        const html = `<!DOCTYPE html><html><body><script>   </script></body></html>`;
        const result = analyze(html, "html");
        expect(result.findings.some((f) => f.ruleId === "html-script-content-not-analyzed")).toBe(false);
    });

    it("does not flag plain HTML with no <script> tag at all", () => {
        const html = `<!DOCTYPE html><html><body><h1>Hello</h1></body></html>`;
        const result = analyze(html, "html");
        expect(result.findings.some((f) => f.ruleId === "html-script-content-not-analyzed")).toBe(false);
    });
});
