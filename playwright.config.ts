import { defineConfig, devices } from "@playwright/test";

/**
 * This is the piece F-06 (docs/self-audit-2026-09-03.md) was still missing
 * after the CI grep guard and the runtime engine-level trap
 * (tests/regression/no-network-at-runtime.test.ts) were added: neither of
 * those exercises the actual React UI in a real browser. This does — it
 * builds the production bundle, serves it, loads it in real Chromium, and
 * asserts zero network requests fire to anything but the local preview
 * server while clicking all the way through a scan, a PDF export, and the
 * opt-in local-history flow.
 *
 * Chromium only, on purpose: this is a targeted trust-verification suite,
 * not cross-browser compatibility testing — one real browser is enough to
 * prove "this UI makes no network calls," and keeping it to one engine
 * keeps CI time and the browser-binary footprint down.
 */
export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
    use: {
        baseURL: "http://localhost:4173",
        trace: "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "npm run preview -- --port 4173",
        url: "http://localhost:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },
});
