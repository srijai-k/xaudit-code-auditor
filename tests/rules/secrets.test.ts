import { describe, it, expect } from "vitest";
import { runGroupSuite, analyzeFixture } from "../helpers";

runGroupSuite("secrets (conservative hardcoded-secret detection)", "secrets");

describe("rule: secrets — no vendor hallucination", () => {
    it("a single real secret must not be mislabeled as multiple unrelated vendors", () => {
        const { result } = analyzeFixture("secret-openai-key");
        const distinctVendorRuleIds = new Set(result.findings.map((f) => f.ruleId));
        expect(distinctVendorRuleIds.size, `expected exactly one vendor rule to fire, got: ${JSON.stringify([...distinctVendorRuleIds])}`).toBe(1);
    });

    it("never includes the raw secret value in a finding snippet", () => {
        const { result } = analyzeFixture("secret-openai-key");
        const raw = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";
        for (const f of result.findings) {
            expect(f.snippet ?? "").not.toContain(raw);
        }
    });

    it("Firebase public web config key is informational, not a fabricated vendor leak", () => {
        const { result } = analyzeFixture("secret-firebase-public-config");
        const finding = result.findings.find((f) => f.ruleId === "secret-google-api-key");
        expect(finding).toBeDefined();
        expect(finding?.severity).toBe("info");
        expect(finding?.title.toLowerCase()).toContain("firebase");
    });
});
