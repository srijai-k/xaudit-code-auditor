import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Drift protection for docs/rules/: every ruleId string literal actually
 * used in a rule module must have a matching documented section
 * (`## <ruleId>`) in that module's doc page — the exact anchor SARIF's
 * `helpUri` now links to (see sarif-generator.ts). Extracts ruleIds
 * directly from the rule source files at test-run time rather than from
 * a hardcoded list, specifically so a future rule change that adds/
 * renames/removes a ruleId without updating docs/rules/ fails a test
 * instead of silently going undocumented (and silently breaking a link
 * SARIF consumers would follow).
 */
const testsDir = path.dirname(fileURLToPath(import.meta.url));
const rulesDir = path.join(testsDir, "..", "..", "src", "lib", "analysis", "rules");
const docsDir = path.join(testsDir, "..", "..", "docs", "rules");

// category -> source file (mirrors analyze.ts's rule registration exactly)
const RULE_FILES: Record<string, string> = {
    xss: "xss.ts",
    sqli: "sqli.ts",
    secrets: "secrets.ts",
    "dynamic-exec": "dynamic-exec.ts",
    "node-command": "node-command.ts",
    auth: "auth.ts",
    "dependency-hygiene": "dependency-hygiene.ts",
    html: "html.ts",
};

// category -> the actual ruleId prefix used in that module. NOT derivable
// from the category name alone (checked directly against the source
// rather than assumed) — "secrets" findings use the singular "secret-"
// prefix, "dynamic-exec" findings use "exec-", and "dependency-hygiene"
// findings use "dep-".
const RULE_ID_PREFIXES: Record<string, string> = {
    xss: "xss-",
    sqli: "sqli-",
    secrets: "secret-",
    "dynamic-exec": "exec-",
    "node-command": "node-command-",
    auth: "auth-",
    "dependency-hygiene": "dep-",
    html: "html-",
};

function extractRuleIds(sourceCode: string): Set<string> {
    const ids = new Set<string>();
    // Matches `ruleId: "..."` / `ruleId, "..."` construction-site literals
    // AND bare `"whatever-shaped-like-a-ruleid"` string literals passed
    // positionally to a local makeFinding(...)-style helper — broad
    // enough to catch every actual pattern used across these 8 files
    // (checked by hand against the real files when this test was written;
    // see the file-by-file ruleId enumeration this test's assertions
    // are compared against).
    const idLikePattern = /"([a-z][a-z0-9]*(?:-[a-z0-9]+)+)"/g;
    let match: RegExpExecArray | null;
    while ((match = idLikePattern.exec(sourceCode))) {
        ids.add(match[1]);
    }
    return ids;
}

// Known non-ruleId string literals that happen to match the same
// kebab-case shape (a name pattern, a regex source, a vendor label, an
// unrelated identifier) — excluded explicitly rather than tightening the
// extraction regex into something fragile.
const KNOWN_NON_RULE_IDS = new Set([
    "sk-proj",
    "your-key",
    "change-me",
    "replace-me",
    "sample-key",
    "api-key",
    "private-key",
    "user-name",
]);

describe("unit: docs/rules/ stays in sync with every actual ruleId (drift protection)", () => {
    for (const [category, filename] of Object.entries(RULE_FILES)) {
        it(`every ruleId-shaped literal actually used in ${filename} that looks like a real ruleId has a documented "## <ruleId>" section in docs/rules/${category}.md`, () => {
            const source = readFileSync(path.join(rulesDir, filename), "utf8");
            const docPath = path.join(docsDir, `${category}.md`);
            const doc = readFileSync(docPath, "utf8");

            const candidates = [...extractRuleIds(source)].filter(
                (id) => id.startsWith(RULE_ID_PREFIXES[category]) && !KNOWN_NON_RULE_IDS.has(id),
            );

            expect(candidates.length, `expected to find at least one ruleId-shaped literal in ${filename}`).toBeGreaterThan(0);

            for (const ruleId of candidates) {
                const hasHeading = new RegExp(`^##\\s+${ruleId}\\s*$`, "m").test(doc);
                expect(hasHeading, `docs/rules/${category}.md is missing a "## ${ruleId}" section for a ruleId found in ${filename}`).toBe(true);
            }
        });
    }

    it("every doc page in docs/rules/ corresponds to a real rule category", () => {
        const files = readdirSync(docsDir).filter((f) => f.endsWith(".md") && f !== "README.md");
        const expectedFiles = Object.keys(RULE_FILES)
            .map((c) => `${c}.md`)
            .sort();
        expect(files.sort()).toEqual(expectedFiles);
    });
});
