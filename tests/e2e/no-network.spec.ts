import { test, expect } from "@playwright/test";

/**
 * Closes the last piece of F-06 (docs/self-audit-2026-09-03.md): the CI
 * grep guard covers literal call sites in source, and
 * tests/regression/no-network-at-runtime.test.ts proves the analysis
 * engine itself never touches a network primitive at runtime — but
 * neither exercises the actual React UI in a real browser. This does.
 *
 * Real Chromium, the real production build, real user interactions
 * (click through the landing page, run a scan, export a PDF, opt into
 * local history) — and a hard assertion that not one network request
 * left localhost the entire time. `page.on("request")` sees every
 * request Chromium actually makes, not just the ones a mock would let
 * through, so this would catch a request made through a compromised
 * dependency's internals, not just a literal `fetch(` call site in this
 * repo's own source.
 *
 * The `page.on("console")` CSP-violation listener below is not
 * decorative — verified this the hard way. This app's own CSP
 * (`connect-src 'self'`) blocks a cross-origin `fetch()` client-side,
 * before Chromium's network stack ever creates a request object — so a
 * CSP-blocked call fires neither `request` nor `requestfailed`, only a
 * console warning. Proved this by temporarily adding a real
 * `fetch("https://example.com/...")` call into the PDF-export path this
 * test exercises: with only the `request`/`requestfailed` listeners, the
 * test *passed* — a false negative. Adding the console listener caught it
 * immediately. Without it, this test would have silently missed exactly
 * the class of regression it exists to catch, for any call blocked by the
 * CSP rather than one that succeeds or is denied by the network layer.
 */
test.describe("E2E: zero network requests during a full real-browser user flow", () => {
    test("landing page → checker → scan → PDF export → local history never leaves localhost", async ({ page, baseURL }) => {
        const externalRequests: string[] = [];
        page.on("request", (req) => {
            const url = req.url();
            const isLocal = url.startsWith(baseURL ?? "http://localhost:4173") || url.startsWith("about:") || url.startsWith("data:") || url.startsWith("blob:");
            if (!isLocal) externalRequests.push(`${req.method()} ${url}`);
        });
        page.on("requestfailed", (req) => {
            const url = req.url();
            const isLocal = url.startsWith(baseURL ?? "http://localhost:4173");
            if (!isLocal) externalRequests.push(`BLOCKED/FAILED ${req.method()} ${url} (${req.failure()?.errorText})`);
        });
        page.on("console", (msg) => {
            if (/content security policy|csp/i.test(msg.text())) externalRequests.push(`CSP-CONSOLE: ${msg.text()}`);
        });

        await page.goto("/");
        await page.getByText(/open the checker/i).first().click();

        // JS/TS/React mode, paste a snippet that fires multiple rule
        // groups at once (xss + secrets), run it, confirm real findings.
        await page.getByText("JS / TS / React", { exact: true }).click();
        await page.locator("textarea").fill(
            'function render(userInput) {\n  el.innerHTML = userInput;\n}\nconst key = "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR";\n',
        );
        await page.getByRole("button", { name: /run analysis/i }).click();
        await expect(page.getByText(/detailed findings/i)).toBeVisible();
        await expect(page.getByText(/unsanitized assignment to \.innerhtml/i).first()).toBeVisible();

        // Opt into local history and re-run — exercises the localStorage
        // write path (the exact path F-01's live secret leak was found
        // in), still under network observation the whole time.
        await page.getByLabel(/save report summaries locally/i).check();
        await page.getByRole("button", { name: /run analysis/i }).click();
        await expect(page.getByText(/detailed findings/i)).toBeVisible();

        // PDF export: jsPDF's .save() triggers a client-side blob
        // download via a programmatically-clicked anchor, not a network
        // request — assert the download actually happens (proving the
        // button does real work), while still asserting zero network
        // calls happened anywhere in this flow.
        const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
        await page.getByRole("button", { name: /export pdf/i }).click();
        const download = await downloadPromise;
        expect(download, "Export PDF should trigger a real client-side download").not.toBeNull();

        // SARIF/JSON export: same Blob-URL-plus-anchor mechanism, but this
        // is the first time it's been checked against the real CSP-enforced
        // production build rather than the CSP-exempt dev server (vite.config.js's
        // preview.headers only applies to `npm run preview`, which is what
        // this e2e suite's webServer runs) — a blob: download could plausibly
        // have been blocked by connect-src/default-src, so this isn't a
        // redundant check of the PDF path.
        const sarifDownloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
        await page.getByRole("button", { name: /export sarif/i }).click();
        const sarifDownload = await sarifDownloadPromise;
        expect(sarifDownload, "Export SARIF should trigger a real client-side download under the enforced CSP").not.toBeNull();

        const jsonDownloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
        await page.getByRole("button", { name: /export json/i }).click();
        const jsonDownload = await jsonDownloadPromise;
        expect(jsonDownload, "Export JSON should trigger a real client-side download under the enforced CSP").not.toBeNull();

        // Clean up local storage via the UI's own control, still observed.
        await page.getByRole("button", { name: /clear local data/i }).click();

        expect(externalRequests, `Unexpected non-local network requests: ${JSON.stringify(externalRequests, null, 2)}`).toEqual([]);
    });
});
