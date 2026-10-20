# XAUDIT

XAUDIT is a client-side static code checker for a defined set of JavaScript, TypeScript, React/JSX, HTML, and `package.json` patterns. Analysis runs entirely in your browser, in a Web Worker, via a real AST parser ([`@babel/parser`](https://babeljs.io/docs/babel-parser)) for code and a JSON-based rule module for `package.json` — a small set of hand-written, unit-tested pattern rules — not an AI model, not regex guesswork over raw text.

**XAUDIT reports potential issues that require human review. A clean result does not mean your code is secure.**

This is a rewrite of an earlier version of this project that made claims — "AI-powered," "WebAssembly," "zero false positives," "enterprise-grade," support for a dozen languages/frameworks — that the code behind it did not back up. See [`docs/baseline-audit.md`](docs/baseline-audit.md) for exactly what was wrong and [`docs/benchmark-report.md`](docs/benchmark-report.md) for measured, current numbers. Nothing in this README is aspirational; everything here has a test.

### A note on this repository's git history

`main`'s own commit log is short and, for one commit, misleading: the analysis engine, every rule module, the full test suite, and most of `docs/` were introduced in a single commit titled as a UI change. The real, granular history of how the engine was actually built — one rule at a time, with the false positives/negatives each one hit and fixed along the way — exists in full on the `rewrite/honest-ast-engine` branch, which is not (and, given `main` is already public, will not be rebased to become) an ancestor of `main`. If you want the real build story rather than `main`'s own `git log`, read that branch's history directly, or `docs/model-improvements.md`, which narrates the same history in plain language and is kept current.

## Current supported checks

Only JavaScript, TypeScript, React/JSX, basic HTML, and `package.json` are analyzed. Rules live in [`src/lib/analysis/rules/`](src/lib/analysis/rules/), each with its own limitations documented in the module and exercised by [`tests/`](tests/). For a page per exact `ruleId` — what it flags, risky/safe examples, severity rationale, limitations, and which tests exercise it — see [`docs/rules/`](docs/rules/).

| Rule group | What it flags | What it deliberately does NOT flag |
|---|---|---|
| DOM XSS ([`xss.ts`](src/lib/analysis/rules/xss.ts)) | `innerHTML`/`outerHTML`/`srcdoc` assignment, `insertAdjacentHTML`, `document.write`/`writeln`, React `dangerouslySetInnerHTML` (including as a variable holding the whole `{ __html }` object), jQuery/AngularJS-jqLite `.html()` on a recognizably jQuery-sourced receiver, a `javascript:` URI built by concatenating that literal scheme with a dynamic value and assigned to `location`/`setAttribute('href'\|'src', ...)`/a JSX `href`\|`src` prop — checked directly at the sink, or traced back **one variable hop** to a never-reassigned `const`/`let` declaration | Literal HTML strings (directly or one hop back); values wrapped in a recognized sanitizer call, directly or one hop back (severity downgraded, not silently cleared); **any JSX event prop** (`onClick`, `onChange`, `onSubmit`, etc. — never inspected at all); jQuery's `.append`/`.prepend`/`.after`/`.before`/`.replaceWith` (deliberately excluded — routinely called with a safe element reference, not a string); a `.html()` call on a receiver not recognizable as jQuery-sourced; an ordinary dynamic redirect/URL with no `javascript:` literal present (the overwhelming normal case — deliberately not flagged); a `javascript:` scheme held in a *variable* rather than written as a literal in the same expression; a value passed through a *second* variable hop (see `docs/model-improvements.md`) |
| Dangerous dynamic execution ([`dynamic-exec.ts`](src/lib/analysis/rules/dynamic-exec.ts)) | `eval(...)`, `new Function(...)`/`Function(...)`, `setTimeout`/`setInterval` called with a string body | `setTimeout`/`setInterval` called with a function reference (the normal case); `import(...)`/`require(...)` with any specifier, literal or computed — a non-literal-specifier check was tried and reverted, see `docs/model-improvements.md` |
| SQL injection — narrow heuristic ([`sqli.ts`](src/lib/analysis/rules/sqli.ts)) | String concatenation or template interpolation passed to `.query` (on a db/client/connection/pool/conn/sql/sequelize/dataSource/queryRunner-shaped receiver)/`.execute`/`.raw`/`.unsafe`/`.$queryRawUnsafe`/`.$executeRawUnsafe`, directly or traced back **one variable hop** | Parameterized queries (`?`/`$1` placeholders), ORM calls (`prisma.user.findUnique(...)`), Prisma's `$queryRaw`/`$executeRaw` used as a tagged template (auto-parameterized, safe by design), `.query()` on a receiver not on the qualified list (e.g. bare `manager` — deliberately excluded, too generic), and SQL built through a *second* variable hop before reaching the call (no general data-flow analysis; see `docs/model-improvements.md`) |
| Hardcoded secrets ([`secrets.ts`](src/lib/analysis/rules/secrets.ts)) | Vendor-prefixed formats (OpenAI, Anthropic, Stripe, AWS, GitHub, GitLab, Slack, PEM private-key blocks, Google API keys); a lower-confidence fallback for string literals assigned to an `API_KEY`/`SECRET`/`TOKEN`/`PASSWORD`-shaped name; a conservative, always-`low`-severity entropy fallback for a high-entropy, token-shaped string with **neither** a vendor format **nor** a credential-shaped name (e.g. a bearer token passed directly as a header value) | Bare UUIDs, canonical-length hex hashes (MD5/SHA-1/SHA-256), npm/yarn SRI integrity hashes, URLs/paths, and base64 image/font blobs — all explicitly excluded from the entropy fallback, calibrated against real examples of each (see `docs/model-improvements.md`); placeholder-shaped values (`your_key_here`, `example`, etc.); public Firebase web-config keys are labeled informational, not a leak |
| Node.js command patterns ([`node-command.ts`](src/lib/analysis/rules/node-command.ts)) — labeled "Node.js patterns," not full command-injection analysis | `exec`/`execSync` with a non-literal argument; `spawn(..., { shell: true })` with a non-literal command/args | `execFile` with static arguments; `spawn` without `shell: true` |
| Express request input ([`express-request.ts`](src/lib/analysis/rules/express-request.ts)) — four narrow checks, each needing request input to reach the call | Something from the request (`req.query`/`body`/`params`/`headers`/`cookies`, `req.get()`, Koa's `ctx.query`/`ctx.request.body`) reaching: `res.send(...)` built into a string (reflected XSS); `res.redirect(...)` (open redirect, medium); `res.sendFile`/`res.download`/`fs.*` paths, `path.join` followed (path traversal); the URL of an outgoing axios/got/http(s)/server-side fetch call (SSRF) — directly or one variable hop back, destructuring included; plus two configuration checks that don't need request input: `cors({ origin: true, credentials: true })` or a manually echoed Origin header with credentials, and `res.cookie()` for a session/auth cookie without `httpOnly: true` | Dynamic values that don't come from the request (the overwhelming normal case for redirects and outgoing calls); input that passes through any non-pass-through call first, so `escapeHtml(...)`/`path.basename(...)`/`encodeURIComponent(...)` stop it; whole request objects sent with `res.send(req.body)` (sent as JSON); `res.sendFile(..., { root })`; redirects starting with a fixed same-site path like `"/users/"`; outgoing calls to a fixed `https://host/` prefix; input passed through a helper function first (documented false negative); validation done elsewhere in the handler (can still be flagged); `cors()` with no credentials or with an origin allowlist; `origin: "*"` with credentials (browsers refuse it); cookie options held in a variable |
| Weak authentication patterns ([`auth.ts`](src/lib/analysis/rules/auth.ts)) — five narrow, name-gated checks, **not** general authentication/session-management analysis | A credential-shaped name (`password`/`token`/`secret`/`apiKey`/`username`) compared directly against a string literal with `===`/`==`/`!==`/`!=`; `jwt.decode()` used with no `jwt.verify()` anywhere in the same file; a password-named value hashed with MD5/SHA-1/SHA-256 (`auth-weak-password-hash`); `Math.random()` building something named like a token/OTP/reset code/session id (`auth-insecure-random-token`); `jwt.sign`/`jwt.verify` with a string-literal secret, one hop back included (`auth-jwt-literal-secret`) | A comparison against a non-literal (the normal, correct case — e.g. comparing to a hash); a UI field or OAuth parameter merely *named* something that happens to contain a credential-shaped word (checks the compared-to literal's shape, never the field-name's own value — see the module's own doc comment); `jwt.verify()` happening in a different file than the `jwt.decode()` call; any comparison via a test-assertion library method (`expect(x).toBe(y)`, not a `===`); fast hashes of data not named like a password (checksums, ETags); `Math.random()` for things not named like a secret (`resetDelay`, `footprint` — names are matched as whole words) |
| HTML hygiene (`html.ts`) — attribute/text checks, **not AST, not security-grade** | Missing viewport meta, missing `alt` text, literal inline `onclick="..."` attributes, missing CSP meta tag. Every inline `<script>` block is also extracted and, if it parses on its own, run through the same five real rules JS/TS/React mode uses (XSS, SQL injection, secrets, dynamic execution, Node.js command patterns), with findings' line numbers remapped back to the actual document | A `<script>` block that can't parse standalone (relies on surrounding template syntax) still only gets an info-only disclosure that it wasn't examined, per block — not a guess at its content; external `<script src="...">` and non-executable script types (`application/json`, etc.) are never parsed |
| Dependency hygiene ([`dependency-hygiene.ts`](src/lib/analysis/rules/dependency-hygiene.ts)) — supply-chain **hygiene**, explicitly **not CVE/vulnerability scanning** | On a pasted `package.json`: an unpinned version range (`*`/`latest`); a git/URL/file dependency source instead of a registry version; a suspicious pattern inside a `scripts` entry (piping a remote download into a shell, a base64-decode step, dynamic `eval`); presence of an install-time lifecycle script (`postinstall`/`prepare`/etc., info-only); a well-known dev-tool package name declared in `dependencies` instead of `devDependencies` | Whether any specific package version has a known CVE (no offline advisory database is integrated — this is never claimed); a missing lockfile (this tool only sees pasted text, so "you didn't paste one" and "you don't have one" are indistinguishable — deliberately not reported as a finding rather than guessed); whether a dependency is actually used anywhere in your code (the dev-tool-misplacement check is a name pattern only, not a usage scan across a repository) |

Every finding carries: what matched, why it matters, a safer example, and its own stated limitations. There is no letter grade, no "ship it" verdict, and no numeric score — see [`docs/scoring-removed.md`](docs/scoring-removed.md) for why that was removed rather than kept.

## Unsupported vulnerability classes

Not implemented, and not claimed: general authentication/session-management analysis (the two narrow checks in the table above are the entire extent of what's covered — no session/cookie/CSRF-token analysis, no login-flow analysis), ReDoS/algorithmic-complexity detection, CSRF, SSRF, prototype pollution, insecure deserialization, dependency/CVE scanning, general command injection beyond the narrow Node.js pattern above, and anything requiring real type information or cross-function data-flow/taint tracking.

## Unsupported languages/frameworks

**Do not assume support for:** Vue, Svelte, Astro, Solid, Next.js-specific patterns, Node.js backend analysis (beyond the narrow command-pattern rule above), Tailwind security analysis, Web Components, or arbitrary "polyglot" code. The UI's language selector only offers what's actually implemented.

## How analysis runs locally

1. Your pasted/typed code is checked against a 500 KB size limit **before** anything else runs (see `MAX_SOURCE_BYTES` in `src/lib/analysis/types.ts`) — oversized input is rejected with a message, not silently truncated or left to freeze the tab.
2. The code is sent (via `postMessage`, in-memory, same-origin) to a dedicated Web Worker (`src/lib/analysis/worker.ts`). Parsing and rule execution happen there, off the UI thread.
3. For HTML input, a lightweight attribute/text scan runs. For everything else, `@babel/parser` builds a real AST (JSX + TypeScript syntax, no type checker) and each rule module traverses it independently.
4. Findings are deduplicated by rule + source location and returned to the main thread.
5. Nothing in this pipeline calls `fetch`, `XMLHttpRequest`, `WebSocket`, or any external SDK. You can verify this yourself: open your browser's Network tab and run a check — see zero requests.

## What data is stored locally, if any

**Nothing, by default.** Your code is never sent anywhere, and nothing is written to `localStorage` unless you explicitly enable "Save report summaries locally" in the checker. When enabled, only this is stored — never raw code, never a full secret value:

- timestamp, detected language, and finding counts by severity
- finding **titles** (not full snippets)
- a masked excerpt of the input (first ~120 characters)

This data is **plaintext** in `localStorage` (not encrypted) — see [`docs/baseline-audit.md`](docs/baseline-audit.md) finding #9 for why the old "LocalStorage encrypted" claim was removed rather than kept. A "Clear local data" button is available on the findings page.

## Checking your AI's fix

After a check, **Check your AI's fix** keeps that result as the "before". Paste the version your AI gave back, run it, and XAUDIT shows what was fixed, what's still there, and anything new it introduced (`src/lib/analysis/compare.ts`, tested in `tests/unit/compare-runs.test.ts`). Findings are matched by rule and code excerpt, then by rule alone, so a reworded but still-broken line counts as "still there", not "fixed". It compares what the rules can see, not what the code does, and the page says so. Flagged lines are highlighted in the editor, and each finding's line number jumps to it.

## Command line and GitHub Action

The same engine checks a whole project: `npm run xaudit -- path/to/project` (text, JSON or SARIF output; exits 1 on findings at or above `--fail-on`, default `high`). The repo is also a GitHub Action (`uses: srijai-k/xaudit-code-auditor@main`) that writes SARIF for code scanning. Both run offline on the machine or runner. See [`docs/cli-and-github-action.md`](docs/cli-and-github-action.md).

## Exporting a report

Three formats, all generated client-side from the exact findings already on screen (no re-analysis, no second interpretation of the results):

- **PDF** — a formatted report for sharing/archiving.
- **SARIF 2.1.0** — the standard format [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), VS Code's SARIF viewer extension, and most CI security tooling already read. Each rule descriptor's `helpUri` links to that exact `ruleId`'s section in [`docs/rules/`](docs/rules/) — a real, stable anchor, not a generic link — and the same safer-example and limitations text is also included directly in each result's `properties`, so the guidance doesn't depend on the link resolving.
- **JSON** — the full analysis result (every finding's rule ID, severity, message, why it matters, safer example, limitations, location, and masked snippet, plus which rules ran and the detected language), wrapped with a tool identifier and the same on-screen disclaimer.

### What's actually in the shipped bundle

PDF export uses [`jsPDF`](https://github.com/parallax/jsPDF)'s vector-drawing API only (`.text()`, `.rect()`, `.roundedRect()`, `.addImage()`) — this app never calls jsPDF's optional `.html()` method (HTML-to-canvas rendering). jsPDF itself, however, bundles [`DOMPurify`](https://github.com/cure53/DOMPurify) (~29 KB) and [`html2canvas`](https://github.com/niklasvh/html2canvas) (~201 KB) as dependencies of that `.html()` feature, and a production build (`npm run build`) ships both as separate chunks regardless of whether the feature is used — confirmed via `npm ls dompurify html2canvas` (both resolve transitively through `jspdf`) and by inspecting `dist/assets/` after a build. Neither library is imported or referenced anywhere in this project's own source, and neither is reachable from any code path this app exposes. This is disclosed here specifically so "what's in the bundle" isn't left to a reviewer's own `npm ls`/`dist/` inspection to discover — see also [`SECURITY.md`](SECURITY.md).

## Benchmark methodology and latest metrics

Two benchmark reports, deliberately kept separate because they measure different things:

- [`docs/benchmark-report.md`](docs/benchmark-report.md), regenerated by `npm run bench` against the exact corpus committed under `tests/fixtures/` — small, one-issue-per-file cases written alongside the rules. **Read the disclaimer at the top before citing any number from it**: this is a regression signal, not an independent measurement of real-world accuracy.
- [`docs/held-out-benchmark-report.md`](docs/held-out-benchmark-report.md), regenerated by `npm run bench:independent` against a separate corpus at `tests/independent-benchmark/` — larger, realistic, multi-concern files with ground truth written down before the engine was ever run against them. Still not a third-party dataset (same author as the rules), but a meaningfully different, second data point. Read its own disclaimer too.
- [`docs/ai-benchmark-report.md`](docs/ai-benchmark-report.md), regenerated by `npm run bench:ai` from `tests/ai-benchmark/`: real, unedited code from AI tools answering 25 everyday prompts, with a person deciding which findings are real. **It's empty until responses are collected** (see [`tests/ai-benchmark/README.md`](tests/ai-benchmark/README.md)); no numbers from it should be quoted before then.

Changes to the detection logic itself, and why, are logged in plain language in [`docs/model-improvements.md`](docs/model-improvements.md). A hostile, evidence-based self-audit — including one privacy bug it found and fixed live — is in [`docs/self-audit-2026-09-03.md`](docs/self-audit-2026-09-03.md).

## Known limitations

- No data-flow or taint analysis anywhere. Every rule looks at a direct AST relationship at a single call/assignment site. A value built in one place and used in another is generally not tracked.
- No type checker. TypeScript syntax parses, but type information is never used by any rule.
- The SQL-injection rule is deliberately narrow (see table above) and will miss anything not shaped like one of its recognized method names on a receiver it recognizes as DB-shaped, with concatenation/interpolation directly at the call site or one variable hop back.
- The secrets rule's entropy fallback will still miss a real secret that's hex-only or otherwise lands under its entropy threshold (a deliberate trade-off — lowering it would start catching hashes/identifiers instead), and has no way to exclude every possible non-secret high-entropy shape, only the ones it was actually calibrated against.
- No input-size streaming/chunking: input above 500 KB is rejected outright rather than analyzed.
- Old-style TypeScript angle-bracket casts (`<Foo>value`) do not parse — permanently ambiguous with JSX once JSX parsing is on, which it always is here. This is the same reason TypeScript itself rejects that syntax in `.tsx` files; use `value as Foo` instead. Decorators (NestJS/Angular/TypeORM/class-validator style, including parameter decorators), enums, private class fields, `satisfies`, and namespaces all parse correctly — checked directly, see `docs/model-improvements.md`.
- PWA/offline behavior: the app shell is precached, but full offline functionality has not been independently verified across browsers — **NOT VERIFIED**, treat as best-effort. A real verification attempt (build the production bundle, serve it, let the service worker cache it, kill the server, confirm the page still loads) was made during `docs/self-audit-2026-09-03.md` and hit a tooling limitation rather than a pass or fail: the automated browser environment used for that audit blocks service-worker registration entirely (confirmed via a control test — an unrelated, definitely-valid script failed to register identically to `sw.js`), so this specific check could not be completed there. It needs a real desktop browser to finish — see that doc for the exact steps.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) are configured for Vercel deployment specifically (`vercel.json`). Hosting the built `dist/` output anywhere else (Netlify, Cloudflare Pages, GitHub Pages, a plain nginx/Docker static host) gets none of this protection unless you add the equivalent host-level configuration yourself — nothing in the build output itself enforces these headers.
- Manually selecting "HTML" mode on input with no HTML markup (plain JavaScript, say) doesn't run the JavaScript rules on it. You get an info-level `html-input-not-html` note saying so instead of a clean result. Input that does have tags but keeps its JavaScript outside `<script>` blocks (a JSX file forced into HTML mode) still isn't checked by the JavaScript rules. Auto-detect and JS/TS/React mode don't have this problem.
- The zero-network-request claim ("0 KB uploaded") is verified manually before releases (including via a live browser-network check as part of `docs/self-audit-2026-09-03.md`), not enforced by an automated CI test — a future change could regress this without CI catching it.
- This is a young rewrite. The rule set is intentionally small; treat "not flagged" as "not covered," not as "checked and clean."

## Responsible disclosure

See [`SECURITY.md`](SECURITY.md).

## Security disclaimer

XAUDIT is a supplementary, best-effort static pattern-checker. It is **not** a substitute for a professional security review, threat modeling, dependency/SCA scanning, penetration testing, or a secure development lifecycle. A clean XAUDIT result does not mean your code is secure, and a reported finding does not by itself mean your code is exploitable — every finding is a pattern match that needs human judgment, not proof either way.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # run the test suite (must pass — CI-gated)
npm run build      # production build
npm run preview    # serve the production build locally with the same
                    # CSP/security headers as vercel.json, to verify the
                    # app works under CSP without needing a live deployment
npm run bench       # regenerate docs/benchmark-report.md from tests/fixtures/
npm run bench:independent  # regenerate docs/held-out-benchmark-report.md
npm run bench:ai    # regenerate docs/ai-benchmark-report.md from tests/ai-benchmark/
npm run xaudit -- <paths>   # check files on disk (see docs/cli-and-github-action.md)
npm run test:e2e    # Playwright, real Chromium: proves the built app makes
                    # zero network requests during a real click-through
                    # (landing page, a scan, PDF export, local history) —
                    # requires `npm run build` first; see playwright.config.ts
```

Architecture notes, parser choice rationale, and the Web Worker design are documented in [`docs/architecture.md`](docs/architecture.md).
