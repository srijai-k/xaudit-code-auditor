# XAUDIT Baseline Audit (Pre-Rewrite)

Recorded before any rewrite work on branch `rewrite/honest-ast-engine`, commit `72c3a64` (HEAD at time of recording).
This is the ground truth the rewrite is measured against. Every item below was verified from source, a live local run (`npm run dev`, port 5180), `npm run build`, `npm audit`, and a 30-case adversarial script run against the shipped `runAudit()`.

## Baseline defects (verified, not assumed)

| # | Defect | Evidence |
|---|---|---|
| 1 | Pure regex/string matching engine. No parser, no AST, no data-flow/taint tracking, no AI model. | `src/lib/audit-engine.ts`, `src/lib/security/*.ts` — every rule is `code.match(/regex/)`. No `@babel/*`, `acorn`, `typescript-estree`, or model client in `package.json`. |
| 2 | SQLi / malicious-code detector (`malicious-detector.ts`) is unreachable dead code. | `run-audit.ts:34` — the call sits after an unconditional `return` inside `if (!validation.isValid) { return {...}; const maliciousCheck = ...; }`. Confirmed empirically: a planted `"SELECT * FROM users WHERE id = " + id` string produced **zero** findings and Grade A. |
| 3 | `<button onClick={handleClick}>` (standard React JSX) reported as `CRITICAL: Inline Click Handler Detected` — "RCE or XSS". | `audit-engine.ts` `injectionPatterns` array: `{ pattern: /onclick=/i, name: 'Inline Click Handler' }`. Reproduced directly: `/onclick=/i.test('onClick={handleClick}')` → `true`. A hand-written, idiomatic `useMemo`/`useCallback` React component scored **Grade F**. |
| 4 | `element.innerHTML = userInput` (raw DOM XSS) is never detected. | `checkSecurity()` computes `hasInnerHtml` only to adjust CSP-suggestion severity; it never becomes its own finding. Verified: `el.innerHTML = userInput` → zero issues, Grade A. |
| 5 | Secret scanner mislabels one real key as multiple unrelated vendor keys. | `secret-scanner.ts`: `Heroku API Key` and `HubSpot API Key` share the *identical* UUID regex; `Segment/Amplitude/Mixpanel/LogDNA/Algolia/Datadog/Travis/Vercel/Netlify` keys are bare 22–50 char alphanumeric/hex classes with no vendor prefix. Verified: one fake OpenAI key produced 6 findings, naming Travis CI (×2), Vercel, Netlify, Segment, and Datadog — none of which were present. The project's own `qa-test-suite.ts` Test 5 plants 4 fake secrets and reports **22**. |
| 6 | `jspdf@4.1.0` (installed) has open critical/high advisories. | `npm audit` → jspdf critical: GHSA-9vjf-qc39-jprp (PDF object injection via `addJS`), GHSA-p5xg-68wr-hm3m (arbitrary JS via AcroForm), GHSA-7x6v-j9x4-qf24 (object injection via FreeText color), plus a GIF-dimension DoS advisory. Fixed upstream at `>=4.2.0`. |
| 7 | No CSP or security headers anywhere. | `vercel.json` has only a SPA rewrite rule. `index.html` has no CSP meta tag. `curl -I` on the dev server returns no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`. |
| 8 | Google Fonts external request contradicts "0 KB uploaded" / privacy framing. | `index.html`: `<link rel="preconnect" href="https://fonts.googleapis.com">` + a `fonts.googleapis.com/css2?...` stylesheet, loaded unconditionally on first paint. |
| 9 | `localStorage` is plaintext despite an on-page "LocalStorage encrypted" claim. | `src/lib/storage.ts`: `localStorage.setItem(STORAGE_KEY, JSON.stringify(report))` — no encryption anywhere in the file. Landing page mock (`Hero.jsx` area) prints the static string `✓ LocalStorage encrypted`. |
| 10 | Language/framework selector (HTML/React/JavaScript/Auto) is cosmetic. | `audit-engine.ts`: `export function runHeuristicAudit(code: string, mode: string)` never reads `mode` inside the function body. Identical rules run regardless of selection. |
| 11 | No input-size cap on the live analysis path; no worker isolation. | `run-audit.ts`/`audit-engine.ts` run ~15–20 sequential full-string regex passes synchronously on the main thread with no length guard. Only `storage.ts`'s *persistence* path has a 2.5 MB cap, which does not protect the analysis pass itself. |
| 12 | "Test suite" scripts (`qa-test-suite.ts`, `malicious-tests.ts`) only `console.log` output; nothing fails a build. | Read in full: every assertion is a `console.log`/`console.error`, no `expect()`, no test runner, not wired into `npm test` (no `test` script exists in `package.json`). |
| 13 | 12 languages/frameworks advertised (JS, TS, React, Vue, Svelte, HTML, Tailwind, Node.js, Next.js, Astro, Solid, Web Components); UI only offers 4 modes and only 3 have any matching rule at all. | `src/components/landing/SupportedLanguagesSection.jsx` renders all 12 as cards. `AuditView.jsx` selector only has HTML/React/JavaScript/Auto. Per finding #10, mode doesn't even change behavior. |
| 14 | Confidence/version/progress indicators are hardcoded, not derived. | `run-audit.ts`: `confidence: "MEDIUM"` is a literal string for every successful run. `ReportView.jsx`: `"High (v2.5)"` and an `85%` bar width are hardcoded JSX, independent of the `confidence` field. `AuditView.jsx` `handleRunAudit`: 5-step fake progress via `await new Promise(r => setTimeout(r, 600))`, fully decoupled from the actual (synchronous, sub-10ms) `runAudit()` call. Landing page shows a static `SYSTEM ONLINE V2.4.0` badge; `package.json` version is `0.0.0`. |

## Baseline metrics (30-case adversarial corpus, run against shipped `runAudit()`)

Binary label: "did XAUDIT raise any security/codeQuality/secrets issue for this snippet?" vs. the case's authored ground truth.

| Group | Cases | TP | FP | FN | TN |
|---|---|---|---|---|---|
| XSS | 7 | 2 | 0 | 2 | 3 |
| SQLi | 6 | 0 | 0 | 4 | 2 |
| Secrets | 6 | 2 | 1 | 0 | 3 |
| Dangerous exec | 5 | 2 | 2 | 1 | 0 |
| ReDoS | 3 | 0 | 0 | 2 | 1 |
| React perf | 3 | 1 | 1 | 1 | 0 |
| **Total** | **30** | **7** | **4** | **10** | **9** |

**Precision = 0.64, Recall = 0.41, F1 = 0.50.**

Baseline `npm run build` output: main bundle `897.24 kB` (286.80 kB gzip), no code splitting; service worker generated (`vite-plugin-pwa`, 15 precache entries, 2.74 MB).

Baseline `npm audit`: 24 vulnerabilities (1 critical — `jspdf`; 17 high, mostly in `vite`/`rollup`/`react-router`/build-time deps; 4 moderate; 2 low).

## What this rewrite must change

Every row in the defects table above must end the rewrite in one of three states: **fixed with a passing test**, **removed from code and copy**, or **explicitly documented as a limitation**. No row may be left silently unaddressed.
