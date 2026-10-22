import { describe, it, expect } from "vitest";
import { parseSource } from "../../src/lib/analysis/parse";
import { experimentalXssRule } from "../../src/lib/analysis/rules/xss-sanitizer-recognition.experimental";

/**
 * Unit tests for the EXPERIMENTAL narrow-DOMPurify-recognition rule variant
 * — see docs/experiments/xss-sanitizer-recognition/. Not registered in
 * analyze.ts; this file exercises the module directly, the same way
 * tests/unit/html-rules.test.ts exercises runHtmlChecks directly rather
 * than through the full analyze() pipeline.
 */
function run(code: string) {
    const parsed = parseSource(code);
    if (!parsed.ok) throw new Error(`fixture failed to parse: ${parsed.error}`);
    return experimentalXssRule.run({ ast: parsed.ast, code });
}

describe("experimental: narrow DOMPurify recognition — must still catch everything baseline catches", () => {
    it("flags a raw innerHTML assignment as high", () => {
        const findings = run(`function f(el, x) { el.innerHTML = x; }`);
        expect(findings).toHaveLength(1);
        expect(findings[0].ruleId).toBe("xss-inner-html");
        expect(findings[0].severity).toBe("high");
    });

    it("does not flag a static string literal", () => {
        const findings = run(`function f(el) { el.innerHTML = "<b>hi</b>"; }`);
        expect(findings).toHaveLength(0);
    });

    it("still flags the javascript: URI group unchanged", () => {
        const findings = run(`function f(payload) { location.href = "javascript:" + payload; }`);
        expect(findings).toHaveLength(1);
        expect(findings[0].ruleId).toBe("xss-location-javascript-uri");
        expect(findings[0].severity).toBe("high");
    });
});

describe("experimental: recognizes structurally-verified DOMPurify calls", () => {
    it("recognizes DOMPurify.sanitize(...) directly at the sink", () => {
        const findings = run(`import DOMPurify from "dompurify";\nfunction f(el, x) { el.innerHTML = DOMPurify.sanitize(x); }`);
        expect(findings).toHaveLength(1);
        expect(findings[0].severity).toBe("low");
        expect(findings[0].message).toContain("not proof that the output is safe");
    });

    it("never uses forbidden certainty wording, even when recognized", () => {
        const findings = run(`import DOMPurify from "dompurify";\nfunction f(el, x) { el.innerHTML = DOMPurify.sanitize(x); }`);
        const text = `${findings[0].message} ${findings[0].saferExample} ${findings[0].limitations}`.toLowerCase();
        // The mandated wording itself hedges with phrases like "is not proof
        // that the output is safe" / "never proves the output is safe" — so
        // this checks for the specific forbidden UNQUALIFIED claims, not for
        // the word "safe" appearing at all.
        for (const forbidden of ["safe by default", "no vulnerability", "fully sanitized", "exploitation prevented", "secure by default"]) {
            expect(text).not.toContain(forbidden);
        }
        expect(text).toContain("not proof that the output is safe");
    });

    it("recognizes DOMPurify.sanitize(...) through one variable hop", () => {
        const findings = run(`import DOMPurify from "dompurify";\nfunction f(el, x) { const clean = DOMPurify.sanitize(x); el.innerHTML = clean; }`);
        expect(findings[0].severity).toBe("low");
    });

    it("recognizes a verified default-import alias called bare", () => {
        const findings = run(`import sanitizeHtml from "dompurify";\nfunction f(el, x) { el.innerHTML = sanitizeHtml(x); }`);
        expect(findings[0].severity).toBe("low");
    });

    it("recognizes a verified namespace import", () => {
        const findings = run(`import * as DOMPurify from "dompurify";\nfunction f(el, x) { el.innerHTML = DOMPurify.sanitize(x); }`);
        expect(findings[0].severity).toBe("low");
    });
});

describe("experimental: does NOT recognize the two baseline over-broad matches", () => {
    it("does not downgrade a local no-op function merely named 'sanitize'", () => {
        const findings = run(`function sanitize(x) { return x; }\nfunction f(el, x) { el.innerHTML = sanitize(x); }`);
        expect(findings).toHaveLength(1);
        expect(findings[0].severity).toBe("high");
    });

    it("does not downgrade an unrelated object's .sanitize() method", () => {
        const findings = run(`const obj = { sanitize(x) { return x; } };\nfunction f(el, x) { el.innerHTML = obj.sanitize(x); }`);
        expect(findings[0].severity).toBe("high");
    });
});

describe("experimental: does not extend trust past its narrow scope", () => {
    it("does not resolve a local alias of the DOMPurify identifier itself", () => {
        const findings = run(`import DOMPurify from "dompurify";\nfunction f(el, x) { const p = DOMPurify; el.innerHTML = p.sanitize(x); }`);
        expect(findings[0].severity).toBe("high");
    });

    it("does not resolve a destructured { sanitize } binding", () => {
        const findings = run(`import DOMPurify from "dompurify";\nfunction f(el, x) { const { sanitize } = DOMPurify; el.innerHTML = sanitize(x); }`);
        expect(findings[0].severity).toBe("high");
    });

    it("does not credit a sink whose value is sanitized-then-concatenated", () => {
        const findings = run(`import DOMPurify from "dompurify";\nfunction f(el, a, b) { const clean = DOMPurify.sanitize(a); el.innerHTML = clean + b; }`);
        expect(findings[0].severity).toBe("high");
    });

    it("does not credit sanitized output passed through an unknown mutator", () => {
        const findings = run(`import DOMPurify from "dompurify";\nfunction mutate(h) { return h; }\nfunction f(el, x) { const clean = DOMPurify.sanitize(x); el.innerHTML = mutate(clean); }`);
        expect(findings[0].severity).toBe("high");
    });

    it("does not let an unrelated DOMPurify call elsewhere in the file clear an unconnected raw sink", () => {
        const findings = run(`import DOMPurify from "dompurify";\nfunction log(x) { DOMPurify.sanitize(x); }\nfunction f(el, raw) { el.innerHTML = raw; }`);
        expect(findings).toHaveLength(1);
        expect(findings[0].severity).toBe("high");
    });
});
