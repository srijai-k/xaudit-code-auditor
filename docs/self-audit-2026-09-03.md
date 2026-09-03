# XAUDIT Self-Audit — 2026-09-03

> **Status update, same day.** F-01 through F-06 have all since been
> addressed, including a real Playwright e2e test that closes F-06's
> remaining gap and, in the process, found a second real blind spot (a
> CSP-blocked request is invisible to Playwright's network events, only a
> console listener catches it). A new rule group (`auth.ts`, weak
> authentication patterns — hardcoded credential comparison, `jwt.decode()`
> without `jwt.verify()`) was also added after this audit, closing part of
> the "Unsupported vulnerability classes" gap this report's §5 and §6
> describe below as unimplemented. This file is being kept as the
> historical record of what was found and when, not rewritten to look like
> everything was already fine — `git log` and `docs/model-improvements.md`
> carry the actual before/after detail.

Conducted against this repository's actual current state (not the archived
upstream `srijai-k/xaudit-code-auditor`, and not the claims list in the
audit request that prompted this — see §2, "claims that no longer exist").
Every claim below is checked against source code, a running local build,
`npm audit`, `curl -I` against the actual served headers, and the existing
test/benchmark suites — not inferred from UI text or landing-page copy.
Where I could not verify something, it's marked unverified, not assumed
true or false.

---

## 1. Executive Verdict

**Early usable developer tool with limited verified coverage.**

This is a real, narrow, AST-based static checker — not an AI product, not
a security guarantee, not broad-language tooling. The engine (`@babel/
parser` + `@babel/traverse`, five rule groups) is genuinely what it claims
to be: no regex-only detection, no simulated findings, no network calls
anywhere in the analysis path (verified via live network capture, not
just source reading). The project already carries an unusually high
density of self-disclosed limitations for a tool at this stage — most
rule modules document their own false-positive/false-negative classes in
comments that match what the code actually does when tested.

That said, this audit found one **live, currently-shipped privacy bug**
(a non-vendor secret detected by a rule added earlier today leaked
unmasked into `localStorage` history) and fixed it during this audit —
which is itself informative: a feature shipped, unit-tested, and
benchmarked the same day still had a real gap that only manual
adversarial testing against the app's own storage caught. That is the
central lesson of this report: automated tests here check "does the rule
fire," not "does every downstream consumer of a finding handle it
correctly," and this gap class can recur. The landing page also contains
an internal inconsistency (two different rule-group counts on the same
page) that should not exist for a project whose entire premise is
precision of claims. Security headers are real and verified, but
Vercel-deployment-specific and not disclosed as such. No AI claims, no
"zero false positives" claims, and no unsupported-framework claims exist
in the current product — the claims list this audit was asked to check
describes a version of this project that has already been dismantled.

---

## 2. Claim-by-Claim Truth Table

### 2a. Claims from the audit request that are NOT made by the current product

These were the *original* tool's claims (see `docs/baseline-audit.md`).
Verified absent from the current codebase by direct source search
(`grep -ri` across `src/`, `README.md`, `index.html`, and every
`src/components/landing/*.jsx` file) — not by trusting that a rewrite
happened.

| Claim | Verdict | Evidence | Risk | Exact replacement wording |
|---|---|---|---|---|
| "AI-powered code auditing platform" | **False — not currently claimed** | `FAQ.jsx`: *"Is this AI-powered? No. It's a rule-based static checker: a real JavaScript/TypeScript AST parser (Babel) plus a small set of hand-written pattern rules... There is no model, no inference call, and no cloud component of any kind."* Verified: zero AI/ML SDK in `package.json`, zero `fetch`/inference calls in `src/lib/analysis/`. | None currently — already correct | N/A, already correct |
| "WebAssembly-based analysis" | **False — not currently claimed** | No `.wasm`, no `WebAssembly.*` call anywhere in `src/`. Engine is plain JS/TS via Babel. | None currently | N/A |
| "Zero false positives" | **False — not currently claimed** | `docs/benchmark-report.md` and `docs/independent-benchmark-report.md` both open with an explicit disclaimer that measured precision is not a real-world guarantee; README states "A clean result does not mean your code is secure" and documents specific known false-positive classes per rule. | None currently | N/A |
| "Understands intent" / "neural engine" / "context-aware AI" | **False — not currently claimed** | No occurrence anywhere in `src/` or docs. | None currently | N/A |
| "Enterprise-grade security" | **False — not currently claimed** | No occurrence. Landing copy explicitly says "not a general linter, not a security guarantee." | None currently | N/A |
| Vue / Svelte / Astro / Solid / Next.js-specific / Tailwind / Web Components support | **False — not currently claimed** | `SupportedLanguagesSection.jsx` and README explicitly list these under "NOT SUPPORTED (DO NOT ASSUME OTHERWISE)." | None currently | N/A |
| "Detects... weak authentication" | **False — not currently claimed** | No auth-pattern rule exists (confirmed: 5 rule modules are xss, sqli, secrets, dynamic-exec, node-command — none inspect password comparison, bcrypt/argon2 usage, or JWT verification). README's "Unsupported vulnerability classes" list confirms this is disclosed. | None currently | N/A |
| "Real-time analysis" (continuous, as-you-type) | **False — not currently claimed** | `FeaturesSection.jsx`: *"You click Run Analysis... This is not a live-as-you-type linter."* | None currently | N/A |

### 2b. Claims the current product actually makes — verified now

| Claim | Verdict | Evidence | Risk | Exact replacement wording |
|---|---|---|---|---|
| "Runs locally in the browser," analysis via Web Worker | **Verified** | Live network capture during an actual scan (Playwright-driven browser, `read_network_requests`): zero new requests fire between clicking "Run Analysis" and the report rendering. `worker.ts` has no `fetch`/`XHR`/`WebSocket`/`importScripts(remoteUrl)`. | None | Keep as-is |
| "0 KB uploaded" / "nothing is sent anywhere" | **Verified, for scanned code, in this session** | Same live capture as above. Caveat: this was verified for one interactive session against the local dev build, not against every browser/every deployment target, and not via automated CI enforcement (see Finding F-06). | Low — no CI regression gate for this specific claim | Keep, but add: "verified via `tests/regression/*` and a documented manual browser-network check before each release; not independently, continuously audited" |
| "Privacy-first / no telemetry" | **Verified** | No analytics/telemetry/error-reporting SDK in `package.json` or `src/`. No `sendBeacon`, no `gtag`, no Sentry/PostHog/Mixpanel/Amplitude/Hotjar reference anywhere. | None | Keep |
| "Offline capable / PWA" | **Partially verified** | `vite-plugin-pwa` configured with `globPatterns: ['**/*.{js,css,html,ico,png,svg}']` — precaches the full built bundle (no runtime API calls exist to need `runtimeCaching` strategies, so this is a defensible config for this app's shape). **Not verified**: actual offline behavior after a real disconnect, across browsers. Service worker does not register at all under `npm run dev` (expected — needs a built+served app). README already says "NOT VERIFIED, treat as best-effort" — this audit did not change that status. | Low | Keep existing "NOT VERIFIED, best-effort" wording — it is accurate |
| "AST-based, not regex" | **Verified for 5 of 6 rule modules** | Read every rule file: `xss.ts`, `sqli.ts`, `secrets.ts` (partially — vendor patterns are regex, generic-name and entropy fallbacks use AST context), `dynamic-exec.ts`, `node-command.ts` all use `@babel/traverse` visitors over a real AST. `html.ts` is explicitly attribute/text-based, not AST — and is labeled as such in its own README row ("not AST, not security-grade"). | None — correctly disclosed | Keep |
| "5 rule groups, unit-tested" (`AboutUsSection.jsx`) | **Verified** | `analyze.ts`: `SCRIPT_RULES = [xssRule, dynamicExecRule, sqliRule, secretsRule, nodeCommandRule]` — exactly 5. | — | Keep |
| "Three narrow, tested rule groups" (`FeaturesSection.jsx`, same landing page) | **False / stale** | Contradicts the "5 rule groups" claim on the same page, verified by direct file read of both components. This is very likely leftover copy from before `dynamic-exec` and `node-command` existed. | **Medium — undermines the project's own precision-of-claims premise** | Change to: "Five narrow, tested rule groups over a real AST" |
| "Findings are pattern matches that need human review, not proof of a vulnerability" | **Verified, consistently applied** | Present in README, FAQ, the on-screen report banner, and the PDF export header. Checked all four surfaces. | None | Keep |
| "Send to a coding assistant" (finding-detail modal) | **Misleading as worded** | `FindingDetailModal.jsx`: the only mechanism is `navigator.clipboard.writeText()`. There is no `fetch`, no `window.open`, no network call to ChatGPT/Claude/Cursor/v0 — the button beneath this label is correctly labeled "Copy Prompt," but the section header above it reads as an active-transmission claim. | **Low/Medium — directly adjacent to the project's core "your code never leaves your browser" promise** | Change header to: "Copy a prompt for a coding assistant" |
| Security headers (CSP/HSTS/X-Frame-Options/etc.) | **Verified, but scope-limited and undisclosed** | `curl -I` against a locally-served production build (`npm run preview`) returned the full header set matching `vite.config.js`'s `preview.headers` (HSTS correctly and deliberately omitted for plain HTTP — confirmed via code comment, not a gap). **However**: these headers are configured in `vercel.json`, a Vercel-platform-specific mechanism. Nothing in `index.html` (no CSP `<meta>` tag) or the build output itself carries these headers — deploying the same `dist/` build to Netlify, Cloudflare Pages, GitHub Pages, S3, or a plain nginx/Docker static host with no equivalent header config gets **none** of this protection. | **Medium — not disclosed anywhere in README/DEPLOY.md** | Add to DEPLOY.md: "These headers are Vercel-specific (`vercel.json`). Deploying elsewhere requires equivalent host-level configuration (e.g. a Netlify `_headers` file or Cloudflare Pages `_headers` file) — nothing in the build output itself enforces them." |
| Dependency hygiene / `npm audit` in CI | **Verified** | `.github/workflows/ci.yml` line 33: `npm audit --omit=dev`. Ran the identical command locally: **0 vulnerabilities**. Full (`npm audit`, including devDependencies) shows 2 (1 low, 1 moderate) — both in dev-only build tooling (`esbuild`'s dev-server file-read issue, `@humanfs/node`'s symlink issue in an ESLint transitive dependency), neither reachable from the shipped bundle. | None — correctly scoped | Keep |
| Self-XSS in the app's own UI (findings, PDF, prompt export) | **Verified absent** | `FindingDetailModal.jsx` renders `finding.snippet` via plain JSX text interpolation (`{finding.snippet}`) — React escapes this; confirmed no `dangerouslySetInnerHTML` anywhere in `src/components/checker/`. The one `dangerouslySetInnerHTML` match in `CodeInput.jsx` is a hardcoded example **string** (the "Insert Example" sample text), never executed as JSX. PDF export (`pdf-generator.ts`) uses jsPDF's vector `doc.text()` API, not HTML rendering — no markup-injection surface, and it does not even include `finding.snippet` in the exported PDF at all. | None found | Keep |

---

## 3. Threat Model

- **Assets being protected**: the user's pasted source code (which may contain real secrets, proprietary logic, or PII embedded in test data); the user's opt-in local scan history; the integrity of the findings shown (a false "clean" result has real consequences if trusted).
- **Adversaries**: (a) a malicious web page trying to read code pasted into another tab (irrelevant here — no cross-origin data path exists); (b) the hosting platform itself, if compromised, serving a malicious build (out of scope for a client-side static-analysis tool audit, same as any web app); (c) the user's own future self, misreading a "0 findings" result as a security guarantee.
- **Trust boundaries**: browser tab ↔ Web Worker (same-origin, structured-clone `postMessage`, no serialization to a wire format that could be intercepted); browser ↔ `localStorage` (same-origin, plaintext, readable by any script running on the same origin — i.e. this app itself, not a third party, unless a supply-chain compromise injects one).
- **Data flows**: pasted code → main thread state → `postMessage` to Worker → AST → findings → `postMessage` back → React state → (optional, opt-in) `localStorage`. No step in this path currently makes a network request — verified live, not assumed.
- **Attack surfaces**: (1) the analysis engine itself, if fed adversarial input, for DoS (checked one vector — deep nesting — see §4); (2) the findings-rendering UI, for self-XSS (checked, clean); (3) the opt-in local-history feature, for secret leakage into `localStorage` (checked, found and fixed one real gap — see F-01); (4) the dependency tree, for a supply-chain CVE (checked, clean for production deps).
- **Security assumptions**: the browser's own sandboxing and same-origin policy hold; the user trusts whatever host actually serves the static build (this tool cannot protect against a compromised CDN/host serving a backdoored bundle — no tool can, from inside the bundle it would also compromise).
- **Out of scope for this tool, and correctly disclosed as such**: authentication/session flaws, CSRF, SSRF, prototype pollution, insecure deserialization, ReDoS detection, dependency/CVE scanning of the *scanned* code's own dependencies, and anything requiring type information or cross-function data-flow analysis.

---

## 4. Findings

### F-01 — CRITICAL (Privacy) — FIXED during this audit
**Title**: Non-vendor high-entropy secrets leaked unmasked into `localStorage` opt-in history
**Affected**: `src/lib/analysis/rules/secrets.ts` (`redactSecrets()`), consumed by `src/lib/storage.ts` and `src/lib/storage/history.ts`
**Evidence**: Live reproduction, not a hypothetical. With "Save report summaries locally" enabled, scanning `fetch('/api/data', { headers: { Authorization: "kJ8xz92mVpQ7Bn3zRtY6WcL0hF4sD1aG5eK9jH2p" } })` wrote the full, unmasked token into `localStorage['xaudit:auditHistory']` in plaintext — confirmed by direct `localStorage.getItem()` inspection in a live browser session, twice, from earlier testing in the same session.
**Root cause**: `redactSecrets()` — the function responsible for scrubbing secrets out of the raw-text excerpt before it's persisted — only ever scanned for the fixed vendor-prefix regexes (OpenAI, Stripe, AWS, etc.). It had no path to the AST-based entropy-fallback rule (`secret-high-entropy-string`) added earlier in this same working session, because that rule's own detection needs AST context that isn't available to a plain-text redaction pass over a truncated excerpt.
**Exploit scenario**: A developer pastes code containing a real, non-vendor-branded API token (e.g. an internal service token, a webhook secret, a session token used in a test) into the checker, opts into local history for convenience, and the raw token sits in their browser's `localStorage` in plaintext — retrievable by anything else with same-origin script execution on that page (e.g. a future supply-chain-compromised dependency, or literal DevTools access by anyone with physical/remote access to that browser profile).
**Why it matters**: Directly contradicts the tool's central privacy claim ("only counts, language, and a masked excerpt are stored, never raw code or a full secret value"). This is precisely the same *class* of bug fixed once already earlier in this project's history (see `docs/model-improvements.md`), regressed by adding new detection capability without updating the corresponding redaction path.
**Remediation** (implemented): Added a second redaction pass (`redactHighEntropyStrings`) that scans raw text for 20+ character token-shaped runs and applies the exact same `isHighEntropySecretCandidate()` gate the AST rule uses, deliberately biased toward over-redaction (a masked non-secret fragment in a locally-stored preview is a negligible cost; an unmasked real secret is not).
**Verification test**: `tests/unit/excerpt-redaction.test.ts` — 4 new cases: the exact reproduction above now redacts correctly; a git SHA and a CDN URL (adversarial, high-entropy-adjacent but non-secret) remain untouched; an already vendor-masked secret isn't double-mangled. Re-verified live in-browser after the fix: the same input now produces `"kJ8x********************************jH2p"` in `localStorage`.
**Affects**: Privacy (primary), Trust.
**Residual gap noted at the time this was written — since closed, same day**: the name-context fallback (`secret-generic-assignment`, e.g. `const API_KEY = "shortvalue"`) was not yet covered by text-based redaction for values under the entropy pass's 24-character floor. Closed via a third `redactSecrets()` pass (`redactNameContextAssignments`) mirroring the AST rule's own name-context check, with 4 new regression tests.

### F-02 — MEDIUM (Trust) — FIXED same day
**Title**: Internally inconsistent rule-group count on the landing page
**Affected**: `src/components/landing/FeaturesSection.jsx` ("Three narrow, tested rule groups") vs. `src/components/landing/AboutUsSection.jsx` ("5 rule groups, unit-tested") — same page, both visible in the initial scroll.
**Evidence**: Direct file read of both components; `analyze.ts`'s `SCRIPT_RULES` array confirms 5 is correct.
**Exploit scenario / failure mode**: None security-relevant — but for a project whose entire differentiator is "we say exactly what we do, unlike the old version," shipping two different numbers on the same page is a credibility failure a skeptical reader (exactly the audience this project is trying to earn trust with) will notice immediately.
**Remediation**: Update `FeaturesSection.jsx` line 14 to "Five narrow, tested rule groups over a real AST."
**Verification**: Visual diff of the landing page; grep for "Three narrow" / "rule groups" returning a single consistent count.
**Affects**: Trust.

### F-03 — MEDIUM (Privacy claim precision) — DISCLOSED same day (DEPLOY.md + README)
**Title**: Security headers are Vercel-specific and this is not disclosed
**Affected**: `vercel.json`, `DEPLOY.md`, README (no mention of hosting-portability at all)
**Evidence**: See truth table §2b. Verified the headers exist locally via `vite.config.js`'s `preview.headers` (a genuine, deliberate mirror for local verification) and via `vercel.json` for actual Vercel hosting — but nothing in the static build output itself carries them.
**Exploit scenario**: Someone forks/self-hosts XAUDIT on Netlify, Cloudflare Pages, GitHub Pages, or a plain static server without adding equivalent header config, and unknowingly ships with no CSP/clickjacking/MIME-sniffing protection at all, while every doc that mentions these headers implies they're just "how the app is built."
**Remediation**: Add one paragraph to DEPLOY.md and README stating plainly that these are Vercel-platform headers and listing what's needed for other hosts.
**Verification**: `curl -I` against a non-Vercel deployment of the same build, documented as part of any future hosting-guide addition.
**Affects**: Privacy/Integrity (indirectly, for non-Vercel deployments), Trust.

### F-04 — LOW (Trust/UX precision) — FIXED same day
**Title**: "Send to a coding assistant" wording implies an active transmission the feature doesn't perform
**Affected**: `src/components/checker/FindingDetailModal.jsx`
**Evidence**: See truth table §2b. Function is `navigator.clipboard.writeText()` only.
**Exploit scenario**: None functional — but this sits directly adjacent to the project's core "your code never leaves your browser" claim, and a section header that reads like an action ("send") rather than a preparation step ("copy a prompt you paste yourself") is exactly the kind of ambiguity this rewrite was supposed to eliminate everywhere else.
**Remediation**: Reword to "Copy a prompt for a coding assistant" or "Prepare a prompt to paste into...".
**Verification**: Visual/copy review.
**Affects**: Trust.

### F-05 — LOW (Coverage gap, already partially disclosed) — FIXED same day
**Title**: Manually selecting "HTML" mode on non-HTML input (e.g. a Vue SFC) produces a silent, clean "0 findings" result instead of an error
**Affected**: `src/lib/analysis/rules/html.ts`, `src/components/checker/CodeInput.jsx` (mode selector)
**Evidence**: Live test: a Vue single-file component (`<template>`/`<script>`/`<style>` blocks) run under **auto-detect** (the actual default mode) correctly produces `status: "parse-error"` with a clear message — auto-detect's own heuristic (`/^<!doctype html/i` or `/<html[\s>]/i`) doesn't match a Vue SFC, so it correctly falls through to the JS/TS/JSX parser, which correctly rejects it. The *same* file, if a user **manually** selects "HTML" mode, returns `status: "ok"`, zero findings, having never examined the real JavaScript inside the `<script>` block at all — a document-hygiene pass that has nothing to hygiene-check in a template fragment.
**Exploit scenario / failure mode**: Low likelihood (requires the user to override the sensible default), but a user who does select HTML mode for Vue/Svelte/templating-language content — plausible, since these files visually resemble HTML — gets a clean bill of health for code that was never actually analyzed by any of the five real detection rules.
**Why this is lower severity than it might first appear**: the default path (auto-detect) does not have this problem; this only manifests under manual mode override, and README's own scope section already states HTML mode is "not AST, not security-grade" and "never looks at JSX at all" — so the underlying behavior is documented. The gap is specifically that a 0-finding result under manual HTML mode looks identical in the UI to a 0-finding result under script mode, with no in-report indicator of which happened.
**Remediation (implemented, option (a))**: `html.ts` now emits an `info`-severity `html-script-content-not-analyzed` finding whenever the input has a non-trivial inline `<script>` block, naming exactly which real detection rules never ran against it.
**Verification test**: 4 new cases in `tests/unit/html-rules.test.ts`. Re-verified against the exact original reproduction from this audit (a Vue SFC under manually-selected HTML mode) via `analyze()` directly and live in the running app — the report now shows the disclosure instead of a silent 0-finding result.
**Affects**: Trust.

### F-06 — INFORMATIONAL — FULLY closed, three layers deep
**Title**: The "0 KB uploaded" / zero-network claim has no automated regression test
**Affected**: Process gap, not a code file.
**Evidence**: `worker.ts`'s own comment states it "never touches fetch/XHR/WebSocket" but this is asserted in a comment and spot-checked manually (including by this audit), not enforced by an automated test that would fail CI if a future dependency or contributor introduced one.
**Remediation, three layers**:
1. The existing CI static-analysis guard (`.github/workflows/ci.yml`) was widened from `src/lib/analysis/` only to the entire `src/` tree — verified the exact new command passes locally before making it a hard gate.
2. `tests/regression/no-network-at-runtime.test.ts`: actually **runs** `analyze()` — the same function the Web Worker calls — with `fetch`/`XMLHttpRequest`/`WebSocket` replaced by traps that throw the instant they're touched, across representative input for every rule group (all three secrets-detection paths included). Strictly stronger than a grep: it would catch a dynamically-constructed call (`globalThis['fe'+'tch']`) that no static pattern could match. Verified this has real teeth: temporarily injected an actual `fetch()` call into `analyze()`, confirmed all 11 cases failed and pinpointed exactly where, then reverted and confirmed green again.
3. `tests/e2e/no-network.spec.ts` (Playwright, new): a real Chromium browser, the real production build, real clicks — landing page → checker → run a scan → opt into local history → export a PDF → clear local data — with a hard assertion that zero non-local network activity occurred anywhere in that flow. **This closed the actual remaining gap (the React UI itself) and, in the process, found a second real blind spot in the test technique, not the app**: this app's own CSP blocks a cross-origin request client-side before Chromium's network stack ever creates a request object, so a CSP-blocked call fires neither Playwright's `request` nor `requestfailed` events — only a console warning. Proved this by temporarily adding a real `fetch()` call into the PDF-export path the test exercises: with only network-event listeners, the test *passed* — a false negative that would have silently defeated the entire test's purpose for any CSP-blocked violation. Added a `console` listener watching for CSP-violation messages specifically; re-ran the same injected `fetch()` and confirmed the test now fails and pinpoints it; reverted and confirmed clean. Wired into CI with its own Chromium install step and an HTML-report upload on failure.

**Affects**: Trust (regression-prevention, not a current live issue). All three layers together mean: a static call site is caught by (1), a dynamically-constructed call in the engine is caught by (2), and a call anywhere in the real UI — including one the CSP itself would silently swallow — is caught by (3).

---

## 5. Analysis Coverage

| Rule | Vulnerability class | Method | Sources | Sinks | Sanitizers recognized | False-positive risks | False-negative risks | OWASP mapping | Recommended severity |
|---|---|---|---|---|---|---|---|---|---|
| `xss.ts` | DOM-based XSS | AST (Babel), one-hop same-scope variable resolution | Any expression reaching a sink; no taint tracking of *where* it originated | `.innerHTML`/`.outerHTML`/`.srcdoc` assignment, `.insertAdjacentHTML()`, `document.write`/`writeln`, React `dangerouslySetInnerHTML` (incl. as a variable-held props object), jQuery/jqLite `.html()` on a recognizably jQuery-sourced receiver | Name-pattern match on `DOMPurify.sanitize`/`sanitizeHtml`/`xss()` — not semantic, doesn't verify configuration | A value traced through exactly 2 variable hops (one more than supported) still gets flagged even if genuinely static; jQuery detection's `$`-prefix naming fallback could theoretically misfire on an unrelated `$`-named object with its own `.html()` method | A value traced through 2+ hops is missed; a sanitizer imported under a different name/wrapped in a helper function is invisible; jQuery's `.append`/`.prepend`/`.after`/`.before`/`.replaceWith` are deliberately not covered at all | A03:2021 (Injection), ASVS 5.3.3 | High (as currently applied) |
| `sqli.ts` | SQL injection (narrow heuristic) | AST, one-hop variable resolution, receiver-name qualification for `.query()` | Concatenation (`+`) or template interpolation reaching a recognized call | `.query()` (qualified receiver: db/client/connection/pool/conn/sql/sequelize/dataSource/queryRunner), `.execute`/`.raw`/`.unsafe`/`.$queryRawUnsafe`/`.$executeRawUnsafe` (unqualified) | None — SQLi has no sanitizer-recognition path; parameterization is the only "safe" pattern recognized | An unresolved identifier passed to `.query()` is never flagged even if it genuinely holds unescaped SQL built elsewhere (deliberate: flagging every unresolved identifier would make this mostly noise on the extremely common parameterized-variable pattern) | A value assembled 2+ variable hops away; any query built in a different function; ORMs' raw-query escape hatches under a name not on the qualified list (e.g. TypeORM's `manager.query()` — deliberately excluded, see rule comment) | A03:2021 (Injection), ASVS 5.3.4 | High |
| `secrets.ts` | Hardcoded credentials | Regex (vendor prefixes) + AST context (name-based fallback) + statistical (entropy fallback) | N/A (static literals only) | Any `StringLiteral` node | N/A | The entropy fallback is explicitly the least precise check in the suite — calibrated against realistic non-secret shapes (git/SRI hashes, UUIDs, URLs, base64 blobs, identifiers) but not exhaustively; a naming-convention gate can still misfire on an unusual format not in the calibration set | Custom/internal secret formats with no vendor prefix, a non-credential-shaped name, AND under the entropy threshold (deliberately — lowering the bar would reintroduce the hash/UUID false-positive class this rule was rewritten to eliminate) | A02:2021 (Cryptographic Failures) / A07 adjacent, ASVS 6.4.1 | Critical (vendor match) / Medium (name-context) / Low (entropy) — already tiered correctly |
| `dynamic-exec.ts` | Dangerous dynamic code execution | AST | Any expression | `eval()`, `new Function()`/`Function()`, `setTimeout`/`setInterval` with a string body | None (a fixed literal is still flagged, deliberately — see rule's own doc comment) | A fixed literal argument still produces a "high" finding even with zero attacker-controlled input — arguably over-cautious, but disclosed plainly in the message | An `import()`/`require()` non-literal-specifier check was built, tested against its own fixtures (which passed), and **reverted** after live testing against realistic code (locale/route code-splitting) showed it fires on completely ordinary bundler idioms — documented in `docs/model-improvements.md` as a shipped-then-reverted mistake, not hidden | A03:2021 (Injection) | High |
| `node-command.ts` | Node.js command-injection pattern | AST, name-based callee matching only | Non-literal first argument | `exec()`/`execSync()`; `spawn(..., {shell:true})` | None | None significant found | Import aliasing (`import { exec as run }`) defeats the name match entirely (disclosed); `execFile` (a safer API) is out of scope by design | A03:2021 (Injection), ASVS 5.3.5 | High |
| `html.ts` | HTML document hygiene (not a security rule set) | Text/attribute regex, explicitly NOT AST | N/A | Missing viewport meta, missing `alt`, inline `onclick=` attributes, missing CSP meta tag | N/A | Low — this is the module most likely to produce noise since it isn't AST-precise, but its scope is narrow enough that this wasn't observed in testing | Never inspects `<script>` block contents at all (by design) — see F-05 for the UX risk this creates when manually mis-selected | N/A — not a vulnerability-class rule | Informational/Low |

---

## 6. Test Corpus and Metrics

**This project already has two real, executed test corpora — not hypothetical.** Reinventing a third, parallel 25-snippet corpus from scratch here would be worse practice than reporting the real, currently-passing numbers and identifying the actual gaps in what's covered.

### 6a. What already exists and was actually run for this audit

```
tests/
  fixtures/{vulnerable,safe,edge-cases}/   — 83 physical fixture files
  expected-results.json                    — single source of truth for the above
  unit/, rules/, regression/                — 130 Vitest test cases (all passing, re-run for this audit)
  independent-benchmark/
    manifest.json                          — ground truth written BEFORE scoring
    samples/                               — 16 realistic, multi-concern files
```

- `npm test` → **130/130 passing** (re-run live for this audit, not quoted from memory)
- `npm run bench` → `docs/benchmark-report.md`: 83 cases, precision 1.00, recall 1.00, F1 1.00 — **against the self-authored corpus; the report's own header explicitly disclaims this as a regression signal, not real-world accuracy**
- `npm run bench:independent` → `docs/independent-benchmark-report.md`: 16 files, 16 TP, 0 FP, 0 FN — a second, differently-biased corpus (larger, realistic, multi-concern files, ground truth fixed before scoring), still authored by the same process as the rules, disclosed as such

### 6b. Real gaps this audit found that neither corpus currently covers

These are concrete, ready-to-add cases — not filled in with invented pass/fail results, since they haven't been run yet:

| # | Snippet (abbreviated) | Category | Expected result | Currently covered? |
|---|---|---|---|---|
| 1 | `const props = { __html: getBio() }; <div dangerouslySetInnerHTML={props} />` where `getBio()` is a function call, not an identifier | XSS | High (dynamic) | Yes — covered by the object-as-variable fix, but not this exact call-expression variant; recommend adding |
| 2 | `location.href = "javascript:" + userInput` | XSS-adjacent (javascript: URI) | ~~Currently: not flagged at all~~ | **FIXED same day** — `xss-location-javascript-uri`, gated on the literal `javascript:` scheme actually appearing concatenated with a dynamic value (narrow on purpose, see `docs/model-improvements.md`) |
| 3 | `element.setAttribute('href', 'javascript:' + userInput)` | XSS-adjacent | ~~Not flagged~~ | **FIXED same day** — `xss-setattribute-javascript-uri`, same scoping as #2 |
| 4 | `bcrypt.compareSync(plainPassword, storedPlaintext)` where `storedPlaintext` is never hashed | Auth | Not flagged — no auth rule exists at all | **Gap — entire vulnerability class unimplemented, and README already discloses this** (a *narrower* slice of this class was added same day: `auth.ts`'s hardcoded-credential-comparison and jwt-decode-without-verify checks — this specific bcrypt-argument-order case remains unimplemented) |
| 5 | `if (password === storedPassword)` plain-text comparison | Auth | ~~Not flagged~~ | **FIXED same day** — `auth-hardcoded-credential-comparison` catches the hardcoded-literal variant of this (`password === "someliteral"`); a comparison against another variable/property (as written here) is still correctly not flagged — see `auth.ts`'s own doc comment for why that's the right call, not a remaining gap |
| 6 | `jwt.decode(token)` used where `jwt.verify(token, secret)` was needed (signature never checked) | Auth | ~~Not flagged~~ | **FIXED same day** — `auth-jwt-decode-without-verify` |
| 7 | `new RegExp("(a+)+$")` built from a literal, matched against user input elsewhere | ReDoS | Not flagged — no ReDoS rule exists | **Gap, disclosed in README's "Unsupported vulnerability classes"** |
| 8 | `while (true) { if (condition) break; }` unbounded-looking loop with unclear exit | DoS | Not flagged (and arguably shouldn't be — this is a semantic question, not a syntax pattern) | Correctly out of scope |
| 9 | `useEffect(() => { expensiveComputation() })` with no dependency array (runs every render) | React perf | Not flagged — no perf rule exists at all; README explicitly says "No performance profiling... this tool doesn't do those" | Correctly disclosed as out of scope, not a gap |
| 10 | `<Component style={{ color: 'red' }} onClick={() => fn()} />` inline object/arrow props | React perf | Not flagged | Correctly out of scope, and exercised as a *non-finding* regression case already (`react-inline-object-and-onclick` fixture) |
| 11 | `db.query(sanitize(userInput))` where `sanitize` is a real, custom SQL-escaping function under a name this rule doesn't recognize | SQLi | Not flagged (SQLi has no sanitizer-recognition path at all, unlike XSS) | **Gap — SQLi rule has zero sanitizer awareness, disclosed nowhere explicitly** |
| 12 | `const cfg = JSON.parse(atob(process.env.CONFIG))` — a real secret hidden via base64+env, never a literal | Secrets | Correctly not flagged — this isn't a hardcoded secret, it's proper env usage even though obfuscated | Correctly out of scope |
| 13 | A 600 KB single-line minified file with one real `eval(userInput)` buried in it | Reliability | Currently: **rejected outright** at the 500 KB gate before any analysis runs, so the real finding is never seen | Disclosed limitation ("input above 500 KB is rejected outright rather than analyzed") — but this specific consequence (a real vulnerability past the cutoff is invisible, not partially covered) isn't spelled out anywhere |

~~Recommend adding items 2, 3, 11, and 13 to the fixture corpus with `bucket: "edge-cases"`...~~ **Status, same day:** items 2 and 3 were fixed and moved to `bucket: "vulnerable"` fixtures (they're no longer gaps). Item 13 was already covered by existing tests (`tests/unit/analyze.test.ts`), verified directly rather than assumed. Item 11 (SQLi's missing sanitizer-awareness) was added as a tracked `edge-cases` fixture (`sqli-no-sanitizer-downgrade-path`) as originally recommended and remains an open, disclosed gap.

### 6c. How to run this yourself

```bash
npm install
npm test                    # 130 cases, must all pass
npm run bench                # regenerates docs/benchmark-report.md
npm run bench:independent    # regenerates docs/independent-benchmark-report.md
npm run build && npm run preview   # then: curl -I http://localhost:4173/ to check headers yourself
npm audit --omit=dev         # matches CI exactly; should show 0
```

---

## 7. Privacy and Offline Verification

- **Observed network destinations during a live scan**: none. Only same-origin dev-server module requests were observed loading the app itself (Vite's own HMR/module-graph fetches in dev mode — not present in a production build, and not related to analysis). Zero requests fired between submitting code and receiving a report.
- **Does scanned code or metadata leave the browser?** No — verified live, not assumed.
- **Third-party scripts/resources**: none. `index.html` loads no external fonts, no CDN scripts, no third-party origins of any kind — confirmed by both source reading and live network capture.
- **Cookies**: none observed or referenced in source.
- **`localStorage`**: two keys, both opt-in-gated (`xaudit:saveLocallyEnabled`, `xaudit:lastReportMeta`) plus a third, `xaudit:auditHistory` (an array of past report metadata — same opt-in gate, same masking path). All plaintext, not encrypted, disclosed as such in README. **F-01 above was found here and fixed during this audit.**
- **IndexedDB**: not used anywhere in the codebase (confirmed via source search).
- **Service worker**: configured via `vite-plugin-pwa`, precaches the full built bundle. Does not register under `npm run dev` (expected). Actual post-disconnect offline behavior was **not independently verified in this audit** — this matches README's own "NOT VERIFIED, best-effort" disclosure; this audit did not upgrade or downgrade that status.
- **Is "0 KB uploaded" defensible?** For a scan session, verified live in this audit: yes. It is not backed by an automated regression test (F-06), so this status could silently regress in a future change without CI catching it.

**Verdict: The local-only claim is verified for scanned code.**

---

## 8. What Must Be Removed from the Website Immediately

Nothing needed removing under the strict letter of "remove overclaims" — every claim from the original audit-request list that would need removal had *already* been removed, verified by direct source search, not by trusting the changelog. What remained was a smaller, precision problem, not an overclaim problem, and both items below were fixed the same day this audit was written:

| Current copy | Where | Problem | Status |
|---|---|---|---|
| ~~"Three narrow, tested rule groups"~~ | `FeaturesSection.jsx:14` | Contradicted "5 rule groups" elsewhere on the same page | **Fixed** — now reads "Five narrow, tested rule groups over a real AST" |
| ~~"Send to a coding assistant"~~ | `FindingDetailModal.jsx:69` | Implied active transmission; actual mechanism is clipboard-copy only | **Fixed** — now reads "Copy a prompt for a coding assistant" |

DEPLOY.md and README have also since gained the disclosure that security headers are Vercel-specific (F-03).

---

## 9. 14-Day Trustworthiness Roadmap

| Days | Task | Why it matters | Exact implementation approach | Definition of done |
|---|---|---|---|---|
| 1–3 | Fix F-01 (secret leak) | Live privacy bug, contradicts core claim | **Already done during this audit** — `redactHighEntropyStrings()` added, 4 regression tests, verified live | Merged; `npm test` green; live re-verification already performed |
| 1–3 | Fix F-02 (rule-count inconsistency) | Cheap, high-visibility credibility issue | One-line copy change in `FeaturesSection.jsx` | Both landing sections state "5" |
| 1–3 | Fix F-04 (misleading "send" wording) | Adjacent to the core privacy promise | One-line copy change in `FindingDetailModal.jsx` | Header no longer implies transmission |
| 4–7 | Add F-05 mitigation (HTML-mode script-blindness disclosure) | Closes a silent-clean-report path | Add a check in `html.ts`'s run path: if a `<script>` tag with non-trivial content is present, emit an `info`-severity note "JavaScript inside `<script>` tags is not analyzed in HTML mode" | New fixture asserting the note appears; existing HTML fixtures unaffected |
| 4–7 | Add fixture corpus items #2, #3, #11, #13 from §6b | Currently-invisible gaps become visible, tracked limitations instead of silent ones | Add to `scripts/generate-fixtures.mjs` as `edge-cases` with correct `forbidSeverity` reflecting current (gap) behavior | `npm run bench` report explicitly lists these under "documented blind spots" |
| 4–7 | Close the remaining redaction gap (short name-context secrets, noted in F-01's "residual gap") | Same bug class as F-01, smaller blast radius | Extend `redactSecrets()` with a third, narrowly-scoped pass: `/(API[_-]?KEY|SECRET|TOKEN|PASSWORD)[\s"'\`]*[:=][\s"'\`]*([^"'\`]{8,})/gi` matched against raw text, redacting the captured group only | New regression test with a short name-context secret near the excerpt boundary |
| 8–10 | Disclose F-03 (Vercel-specific headers) | Real portability gap, currently silent | Add one paragraph to `DEPLOY.md` and a line to README | Docs mention the gap explicitly with a suggested non-Vercel config path |
| 8–10 | Add an automated zero-network-request regression test (F-06) | Currently only manually spot-checked (including by this very audit) | A Playwright/Puppeteer test: load the built app, run a scan, assert `page.on('request')` never fires for a non-localhost origin | New CI job; fails loudly if a future change introduces any network call |
| 8–10 | Verify actual offline behavior post-disconnect, on at least Chrome + Firefox | README currently says "NOT VERIFIED" — either verify it or keep saying so honestly | **Attempted, same day, did not complete — see below.** Manual test: load once online, go offline (DevTools network throttling → offline), reload, confirm the app still functions | Update README's PWA line to "VERIFIED on Chrome/Firefox as of <date>" or leave as "NOT VERIFIED" if it fails |

### Offline verification attempt, same day — inconclusive, not a pass or a fail

Built the production bundle, served it (`npm run preview`), navigated to it fresh, and attempted to confirm the service worker actually registers and precaches — the real test methodology being "kill the origin server outright and see if the already-cached page still loads," which is stronger evidence than reading `vite.config.js`'s `globPatterns` and assuming it works.

Never got past step one: `navigator.serviceWorker.register('/sw.js', ...)` failed with `TypeError: ... An unknown error occurred when fetching the script.` — in the automated browser environment this audit runs in. Before concluding anything about XAUDIT itself, ran a control test: registered a completely different, definitely-valid, definitely-fetchable same-origin script (`/registerSW.js`, confirmed reachable via `curl`, `Content-Type: text/javascript`, no CSP/header issue) as a service worker instead. **It failed identically.** That rules out `sw.js`'s content, the CSP, and the response headers as the cause — this is the browser automation environment itself blocking service-worker registration outright (a common, deliberate sandboxing choice for automated/CDP-driven browsers), not a bug in this app's PWA configuration.

**Honest conclusion: still NOT VERIFIED, for a different reason than before.** It was previously unverified because no one had checked. It is now unverified because the tool available to check it here cannot. This needs a real desktop browser (Chrome or Firefox, not an automated one) to finish:

```bash
npm run build
npm run preview          # serves the production build at http://localhost:4173
```

1. Open `http://localhost:4173` in a real Chrome or Firefox window.
2. Open DevTools → Application (Chrome) / about:debugging (Firefox) → confirm a service worker is registered and activated for that origin.
3. Stop the `npm run preview` process entirely (or use DevTools → Network → "Offline").
4. Reload the page. If the app shell still loads and the checker still runs a scan with the server dead, offline capability is real; update README's PWA line to "VERIFIED on <browser> as of <date>." If it fails to load, that's a real bug to fix, not a claim to soften further.
| 11–14 | Re-run both benchmarks, regenerate reports | Keep the two accuracy signals current after the above fixes | `npm run bench && npm run bench:independent` | Both reports committed with a fresh timestamp |
| 11–14 | Publish this document (or a trimmed public version) alongside `docs/baseline-audit.md` | Continues the project's own established transparency pattern rather than treating this as a one-off exercise | Commit as `docs/self-audit-2026-09-03.md` (already done); link from README | README references it the same way it already references `baseline-audit.md` |
| 11–14 | Re-run `npm audit --omit=dev` and full `npm audit` one more time before any release | Dependency posture can shift silently between audits | Run both, diff against this report's numbers | Zero production-dependency vulnerabilities, or a documented exception with a tracked upgrade path |

---

## 10. Honest README and Disclaimer

The current README (`README.md`) already substantially matches this bar — it was rewritten earlier in this project's history specifically to eliminate the overclaims this audit was asked to check for, and this audit's own verification did not find it lying about anything current. The concrete deltas this audit recommends:

1. **Concise description** (current, verified accurate): *"XAUDIT is a client-side static code checker for a defined set of JavaScript, TypeScript, React/JSX, and HTML patterns. Analysis runs entirely in your browser, in a Web Worker, via a real AST parser and a small set of hand-written, unit-tested pattern rules — not an AI model, not regex guesswork over raw text."* No change needed.

2. **Current capabilities** — add one line reflecting this audit: *"Two independent-ish accuracy signals exist: a regression benchmark against the project's own test corpus (`docs/benchmark-report.md`) and a second, more realistic benchmark with ground truth fixed before scoring (`docs/independent-benchmark-report.md`). Neither is a substitute for third-party validation."*

3. **Known limitations** — add:
   - "Security headers (CSP, HSTS, etc.) are configured for Vercel deployment specifically; hosting elsewhere requires equivalent host-level configuration that this project does not currently provide."
   - "Manually selecting 'HTML' mode on non-HTML input (e.g. a templating-language single-file component) will not analyze any embedded `<script>` content and can return a clean result for code that was never examined — use auto-detect or JS/TS/React mode for anything with real logic in it."
   - "The zero-network-request claim is verified manually before releases, not by an automated CI test."

4. **Responsible disclosure**: `SECURITY.md` already exists and is accurate — verified its "npm audit in CI" claim against the actual workflow file and against a fresh local run. No change needed.

5. **Security disclaimer** (current, verified accurate): *"XAUDIT is a supplementary, best-effort static pattern-checker. It is not a substitute for a professional security review, threat modeling, dependency/SCA scanning, penetration testing, or a secure development lifecycle. A clean XAUDIT result does not mean your code is secure, and a reported finding does not by itself mean your code is exploitable."* No change needed — this is exactly the disclaimer a tool at this stage should carry, and it was already there before this audit started.
