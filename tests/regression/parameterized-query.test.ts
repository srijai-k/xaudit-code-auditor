import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

/**
 * See docs/baseline-audit.md finding #2 — the old SQLi detector existed but
 * was unreachable dead code, so it never caught anything AND never had the
 * chance to false-positive on safe parameterized queries either. This test
 * locks in the new, live rule's precision on the specific safe shapes the
 * spec calls out.
 */
describe("regression: parameterized/ORM queries must not be flagged as SQL injection", () => {
    const safeCases: Array<[string, string]> = [
        ["$1 placeholder", `function getUser(id) {\n  const query = "SELECT * FROM users WHERE id = $1";\n  return db.query(query, [id]);\n}\n`],
        ["? placeholder", `function getUser(email) {\n  return client.query("SELECT * FROM users WHERE email = ?", [email]);\n}\n`],
        ["Prisma ORM", `async function getUser(id) {\n  return prisma.user.findUnique({ where: { id } });\n}\n`],
    ];

    for (const [label, code] of safeCases) {
        it(`${label} produces no sqli finding`, () => {
            const result = analyze(code, "script");
            expect(result.status).toBe("ok");
            expect(result.findings.filter((f) => f.category === "sqli")).toHaveLength(0);
        });
    }

    it("concatenated SQL passed directly to db.query() IS still caught (sanity check the rule is live)", () => {
        const code = `function getUser(id) {\n  return db.query("SELECT * FROM users WHERE id = " + id);\n}\n`;
        const result = analyze(code, "script");
        expect(result.findings.some((f) => f.ruleId === "sqli-dynamic-query")).toBe(true);
    });

    it("KNOWN LIMITATION: concatenation built in an intermediate variable is NOT caught (no data-flow analysis)", () => {
        const code = `function getUser(id) {\n  const query = "SELECT * FROM users WHERE id = " + id;\n  return db.query(query);\n}\n`;
        const result = analyze(code, "script");
        expect(result.findings.filter((f) => f.category === "sqli")).toHaveLength(0);
    });
});
