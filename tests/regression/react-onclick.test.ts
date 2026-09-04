import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

/**
 * This is the single most important regression test in the whole suite.
 * The old engine flagged `<button onClick={handleClick}>` as
 * "CRITICAL: Inline Click Handler Detected — RCE or XSS" because a
 * case-insensitive `/onclick=/i` regex matched the JSX prop text. See
 * docs/baseline-audit.md finding #3 for the original evidence.
 */
describe("regression: React onClick/onChange/onSubmit must never be XSS/RCE findings", () => {
    it("plain onClick handler produces zero findings", () => {
        const code = `export default function Button() {\n  const handleClick = () => console.log('clicked');\n  return <button onClick={handleClick}>Submit</button>;\n}\n`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings).toHaveLength(0);
    });

    it("onChange and onSubmit handlers produce zero findings", () => {
        const code = `export default function Form({ onSave }) {\n  const handleChange = (e) => console.log(e.target.value);\n  const handleSubmit = (e) => { e.preventDefault(); onSave(); };\n  return <form onSubmit={handleSubmit}><input onChange={handleChange} /></form>;\n}\n`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings).toHaveLength(0);
    });

    it("no finding category is ever 'xss' for any on* JSX prop by itself", () => {
        const code = `export default function Kitchen() {\n  return (\n    <div onMouseEnter={() => {}} onFocus={() => {}} onBlur={() => {}} onKeyDown={() => {}}>\n      <button onClick={() => {}}>Go</button>\n    </div>\n  );\n}\n`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.filter((f) => f.category === "xss")).toHaveLength(0);
    });
});
