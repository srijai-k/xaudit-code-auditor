import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";
import { compareRuns } from "../../src/lib/analysis/compare";

const ids = (fs: { ruleId: string }[]) => fs.map((f) => f.ruleId).sort();

describe("compareRuns: did the AI's fix actually work?", () => {
    const before = `
app.get("/u", (req, res) => {
  pool.query("SELECT * FROM users WHERE id = " + req.query.id);
  res.send("<h1>" + req.query.name + "</h1>");
});
const OPENAI_API_KEY = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";
`;

    it("reports a real fix as fixed, an untouched problem as still there, and a new one as introduced", () => {
        const after = `
app.get("/u", (req, res) => {
  pool.query("SELECT * FROM users WHERE id = $1", [req.query.id]);
  res.send("<h1>" + req.query.name + "</h1>");
  res.redirect(req.query.next);
});
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
`;
        const c = compareRuns(analyze(before).findings, analyze(after).findings);
        expect(ids(c.fixed)).toEqual(["secret-openai", "sqli-dynamic-query"]);
        expect(ids(c.stillThere)).toEqual(["express-reflected-xss"]);
        expect(ids(c.introduced)).toEqual(["express-open-redirect"]);
    });

    it("doesn't count a reworded but still-broken line as fixed", () => {
        const after = `
app.get("/u", (req, res) => {
  const userId = req.query.id;
  pool.query(\`SELECT * FROM users WHERE id = \${userId}\`);
  res.send("<h1>" + req.query.name + "</h1>");
});
const OPENAI_API_KEY = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";
`;
        const c = compareRuns(analyze(before).findings, analyze(after).findings);
        expect(c.fixed).toEqual([]);
        expect(ids(c.stillThere)).toEqual(["express-reflected-xss", "secret-openai", "sqli-dynamic-query"]);
        expect(c.introduced).toEqual([]);
    });

    it("counts duplicates of the same rule one for one", () => {
        const two = `el.innerHTML = a; other.innerHTML = b;`;
        const one = `el.textContent = a; other.innerHTML = b;`;
        const c = compareRuns(analyze(two).findings, analyze(one).findings);
        expect(c.fixed.length).toBe(1);
        expect(c.stillThere.length).toBe(1);
        expect(c.introduced.length).toBe(0);
    });

    it("an identical re-run changes nothing", () => {
        const r = analyze(before).findings;
        const c = compareRuns(r, analyze(before).findings);
        expect(c.fixed).toEqual([]);
        expect(c.introduced).toEqual([]);
        expect(c.stillThere.length).toBe(r.length);
    });
});
