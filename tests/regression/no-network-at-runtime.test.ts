import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { analyze } from "../../src/lib/analysis/analyze";

/**
 * Deepens F-06 from docs/self-audit-2026-09-03.md: the CI guard
 * (.github/workflows/ci.yml) is a static grep over source text for literal
 * `fetch(`/`new XMLHttpRequest(`/`new WebSocket(` call sites. That's real,
 * but it cannot catch a call constructed dynamically (e.g.
 * `globalThis['fe' + 'tch']`) or one made through a dependency's own
 * internals rather than a literal call site in this repo's source.
 *
 * This test is a different, stronger kind of evidence: it actually RUNS
 * the analysis engine — the same `analyze()` the Web Worker calls — with
 * every network primitive replaced by a function that throws the instant
 * it's touched, across representative input for every rule group
 * (including all three secrets-detection paths: vendor, entropy, and
 * name-context). If analyze() ever invokes any of them, this fails loudly
 * regardless of how the call was constructed.
 *
 * What this does NOT cover: the React UI (PDF export, clipboard-copy
 * prompt, landing page) isn't exercised here — only the core engine. A
 * true end-to-end browser test (Playwright/Puppeteer, loading the real
 * app and asserting zero network requests) would close that remaining
 * gap; this project has no browser-automation test framework set up yet,
 * so that's a real, disclosed, still-open piece of F-06, not silently
 * treated as solved by this file.
 */
describe("regression: the analysis engine never touches a network primitive at runtime, across every rule group", () => {
    let networkCallAttempted: string | null = null;
    let originalFetch: typeof globalThis.fetch | undefined;
    let originalXHR: unknown;
    let originalWS: unknown;

    beforeEach(() => {
        networkCallAttempted = null;
        originalFetch = globalThis.fetch;
        originalXHR = (globalThis as Record<string, unknown>).XMLHttpRequest;
        originalWS = (globalThis as Record<string, unknown>).WebSocket;

        const trap = (name: string) => {
            networkCallAttempted = name;
            throw new Error(`${name} was invoked during analysis — the analysis engine must never touch the network`);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).fetch = (...args: unknown[]) => trap(`fetch(${JSON.stringify(args)})`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).XMLHttpRequest = class {
            constructor() {
                trap("new XMLHttpRequest()");
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).WebSocket = class {
            constructor() {
                trap("new WebSocket()");
            }
        };
    });

    afterEach(() => {
        (globalThis as Record<string, unknown>).fetch = originalFetch;
        (globalThis as Record<string, unknown>).XMLHttpRequest = originalXHR;
        (globalThis as Record<string, unknown>).WebSocket = originalWS;
    });

    const scriptSamples: Array<[string, string]> = [
        ["xss", `function render(userInput) { document.getElementById('x').innerHTML = userInput; }`],
        ["xss-jquery", `function render(userInput) { $('#el').html(userInput); }`],
        ["sqli", `function q(id) { return db.query("SELECT * FROM x WHERE id = " + id); }`],
        ["secrets-vendor", `const key = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";`],
        ["secrets-name-context", `const API_KEY = "hunter2!";`],
        ["secrets-entropy", `const config = "kJ8xz92mVpQ7Bn3zRtY6WcL0hF4sD1aG5eK9jH2p";`],
        ["dynamic-exec", `function run(x) { eval(x); }`],
        ["node-command", `const { exec } = require('child_process'); function run(x) { exec("ls " + x); }`],
        ["decorator-syntax", `@Injectable()\nclass Foo {\n  @Get(':id') find(@Param('id') id) { return db.query("SELECT * FROM x WHERE id = " + id); }\n}\n`],
    ];

    for (const [label, code] of scriptSamples) {
        it(`analyze() in script mode never touches the network — ${label}`, () => {
            expect(() => analyze(code, "script")).not.toThrow();
            expect(networkCallAttempted).toBeNull();
        });
    }

    it("analyze() in html mode never touches the network", () => {
        const html = `<!DOCTYPE html><html><body><img src="a.png"><button onclick="x()"></button><script>eval(1)</script></body></html>`;
        expect(() => analyze(html, "html")).not.toThrow();
        expect(networkCallAttempted).toBeNull();
    });

    it("analyze() on a parse error never touches the network", () => {
        expect(() => analyze("const x = <string>value;", "script")).not.toThrow();
        expect(networkCallAttempted).toBeNull();
    });
});
