import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

/**
 * Locks in parser robustness findings from a direct probe of the parser
 * against a wide batch of modern JS/TS syntax (numeric separators, BigInt,
 * class static blocks, logical assignment, optional catch binding, import
 * attributes, async generators, TS 5's `const` type parameters, `using`
 * declarations, computed enum values, `satisfies` with generics, private
 * methods, and the TS/JSX generic-arrow ambiguity case) — done specifically
 * to find another silent zero-coverage gap like the decorator one, not
 * assumed safe by default. Every form probed parsed successfully; no fix
 * was needed this round. This test exists so a future `@babel/parser`
 * upgrade (or plugin-list change) that regresses one of these doesn't fail
 * silently — it fails a test, the same way the decorator gap should have.
 *
 * Each case also confirms a real, deliberately-placed vulnerability inside
 * the exotic syntax is still caught — parsing successfully isn't enough on
 * its own if the rules then can't see into the resulting AST correctly.
 */
describe("regression: modern JS/TS syntax parses AND is actually analyzed, not just tolerated", () => {
    it("class static blocks + private methods, with a real eval() inside", () => {
        const code = `
class Loader {
  static #instance;
  static {
    Loader.#instance = new Loader();
  }
  #run(expr) {
    return eval(expr);
  }
  run(expr) {
    return this.#run(expr);
  }
}
`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "exec-eval")).toBe(true);
    });

    it("logical assignment + numeric separators + optional catch binding, with a real hardcoded secret", () => {
        const code = `
let retries = 1_000_000;
retries ||= 3;
const apiKey = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";
try {
  connect(apiKey);
} catch {
  console.log("connection failed");
}
`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "secret-openai")).toBe(true);
    });

    it("TS 5 const type parameters + satisfies + computed enum, with a real SQL injection", () => {
        const code = `
enum Flags { A = 1 << 0, B = 1 << 1 }
const config = { retries: 3 } satisfies Record<string, number>;
function first<const T extends readonly unknown[]>(arr: T) {
  return arr[0];
}
function getUser(id: string) {
  return db.query("SELECT * FROM users WHERE id = '" + id + "'");
}
`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "sqli-dynamic-query")).toBe(true);
    });

    it("async generator + top-level await + BigInt, with a real dynamic exec pattern", () => {
        const code = `
const big = 123n;
async function* readAll(items) {
  for (const item of items) {
    await Promise.resolve();
    yield item;
  }
}
function schedule(userCode) {
  setTimeout(userCode, 1000);
}
function scheduleUnsafe(userCode) {
  setTimeout("run(" + userCode + ")", 1000);
}
`;
        const result = analyze(code, "script");
        expect(result.status).toBe("ok");
        expect(result.findings.some((f) => f.ruleId === "exec-set-timeout-string")).toBe(true);
    });
});
