import { describe, it, expect } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

// AI users paste a lot of Python. Before this, it got Babel's
// "Unexpected token" error, which reads like XAUDIT is broken.
describe("Python input gets a plain explanation instead of a parse error", () => {
    it("says it's Python and that no rules ran", () => {
        const r = analyze(`import sqlite3\n\ndef get_user(name):\n    cur.execute("SELECT * FROM users WHERE name = '" + name + "'")\n    return cur.fetchone()\n`);
        expect(r.status).toBe("parse-error");
        expect(r.error).toMatch(/looks like Python/);
        expect(r.error).toMatch(/none of its rules ran/);
    });

    it("doesn't call broken JavaScript Python", () => {
        const r = analyze(`function f( { return 1 }`);
        expect(r.status).toBe("parse-error");
        expect(r.error).toMatch(/Could not parse this as JavaScript/);
    });

    it("doesn't call valid JavaScript Python, even with a # private field and True-ish words", () => {
        const r = analyze(`class A { #count = 0; inc() { return ++this.#count; } }\nconst label = "True or False";`);
        expect(r.status).toBe("ok");
    });
});
