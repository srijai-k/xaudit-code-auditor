import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

/**
 * See docs/baseline-audit.md finding #5. The old secret scanner mislabeled
 * a single planted secret as up to six unrelated vendors' keys at once
 * (Travis CI, Vercel, Netlify, Segment, Datadog — none of which were
 * present). This test locks in that a public Firebase web config key is
 * (a) recognized as Google's key format, (b) NOT relabeled as some other
 * vendor, and (c) reported as informational, not a critical leak.
 */
describe("regression: public Firebase web config is not a fabricated vendor leak", () => {
    const code = `const firebaseConfig = {\n  apiKey: "AIzaSyD1234567890abcdefghijklmnopqrstuv",\n  authDomain: "demo-app.firebaseapp.com",\n  projectId: "demo-app"\n};\ninitializeApp(firebaseConfig);\n`;

    it("produces exactly one finding, correctly attributed to Google's key format", () => {
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings).toHaveLength(1);
        expect(result.findings[0].ruleId).toBe("secret-google-api-key");
    });

    it("is severity 'info', not 'critical' or 'high'", () => {
        const result = analyze(code, "script");
        expect(result.findings[0].severity).toBe("info");
    });

    it("never names an unrelated vendor (Travis, Vercel, Netlify, Segment, Datadog, Heroku, HubSpot)", () => {
        const result = analyze(code, "script");
        const titles = result.findings.map((f) => f.title.toLowerCase()).join(" | ");
        for (const wrongVendor of ["travis", "vercel", "netlify", "segment", "datadog", "heroku", "hubspot"]) {
            expect(titles).not.toContain(wrongVendor);
        }
    });
});
