# XAUDIT

XAUDIT is a client-side static code checker for a defined set of JavaScript, TypeScript, React/JSX, and HTML patterns. Analysis runs entirely in your browser, in a Web Worker, via a real AST parser ([`@babel/parser`](https://babeljs.io/docs/babel-parser)) and a small set of hand-written, unit-tested pattern rules — not an AI model, not regex guesswork over raw text.

**XAUDIT reports potential issues that require human review. A clean result does not mean your code is secure.**

This is a rewrite of an earlier version of this project that made claims — "AI-powered," "WebAssembly," "zero false positives," "enterprise-grade," support for a dozen languages/frameworks — that the code behind it did not back up. See [`docs/baseline-audit.md`](docs/baseline-audit.md) for exactly what was wrong and [`docs/benchmark-report.md`](docs/benchmark-report.md) for measured, current numbers. Nothing in this README is aspirational; everything here has a test.

## Current supported checks

Only JavaScript, TypeScript, React/JSX, and basic HTML are analyzed. Rules live in [`src/lib/analysis/rules/`](src/lib/analysis/rules/), each with its own limitations documented in the module and exercised by [`tests/`](tests/).

| Rule group | What it flags | What it deliberately does NOT flag |
|---|---|---|
| DOM XSS ([`xss.ts`](src/lib/analysis/rules/xss.ts)) | `innerHTML`/`outerHTML` assignment, `insertAdjacentHTML`, `document.write`/`writeln`, React `dangerouslySetInnerHTML` — only when the value isn't a static string literal | Literal HTML strings; values wrapped in a recognized sanitizer call (severity downgraded, not silently cleared); **any JSX event prop** (`onClick`, `onChange`, `onSubmit`, etc. — these are never inspected by this rule at all) |
| Dangerous dynamic execution ([`dynamic-exec.ts`](src/lib/analysis/rules/dynamic-exec.ts)) | `eval(...)`, `new Function(...)`/`Function(...)`, `setTimeout`/`setInterval` called with a string body | `setTimeout`/`setInterval` called with a function reference (the normal case) |
| SQL injection — narrow heuristic ([`sqli.ts`](src/lib/analysis/rules/sqli.ts)) | String concatenation or template interpolation passed **directly** to `.query`/`.execute`/`.raw`/`.unsafe` | Parameterized queries (`?`/`$1` placeholders), ORM calls (`prisma.user.findUnique(...)`), and — importantly — SQL built in an intermediate variable and passed in by reference (no data-flow analysis; see `tests/regression/parameterized-query.test.ts`'s documented known limitation) |
| Hardcoded secrets ([`secrets.ts`](src/lib/analysis/rules/secrets.ts)) | Vendor-prefixed formats only: OpenAI, Anthropic, Stripe, AWS, GitHub, GitLab, Slack, PEM private-key blocks, Google API keys — plus a lower-confidence fallback for string literals assigned to an `API_KEY`/`SECRET`/`TOKEN`/`PASSWORD`-shaped name | Bare UUIDs/hex/alphanumeric strings with no vendor prefix (the old scanner's biggest source of false positives — see baseline finding #5); placeholder-shaped values (`your_key_here`, `example`, etc.); public Firebase web-config keys are labeled informational, not a leak |
| Node.js command patterns ([`node-command.ts`](src/lib/analysis/rules/node-command.ts)) — labeled "Node.js patterns," not full command-injection analysis | `exec`/`execSync` with a non-literal argument; `spawn(..., { shell: true })` with a non-literal command/args | `execFile` with static arguments; `spawn` without `shell: true` |
| HTML hygiene (`html.ts`) — attribute/text checks, **not AST, not security-grade** | Missing viewport meta, missing `alt` text, literal inline `onclick="..."` attributes, missing CSP meta tag | Anything about JS/JSX inside the page; this module never looks at JSX at all |

Every finding carries: what matched, why it matters, a safer example, and its own stated limitations. There is no letter grade, no "ship it" verdict, and no numeric score — see [`docs/scoring-removed.md`](docs/scoring-removed.md) for why that was removed rather than kept.

## Unsupported vulnerability classes

Not implemented, and not claimed: authentication/session-management flaws, ReDoS/algorithmic-complexity detection, CSRF, SSRF, prototype pollution, insecure deserialization, dependency/CVE scanning, general command injection beyond the narrow Node.js pattern above, and anything requiring real type information or cross-function data-flow/taint tracking.

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

## Benchmark methodology and latest metrics

See [`docs/benchmark-report.md`](docs/benchmark-report.md), regenerated by `npm run bench` against the exact corpus committed under `tests/fixtures/` (54 cases). **Read the disclaimer at the top of that report before citing any number from it** — it is a regression benchmark against this project's own test corpus, not an independent measurement of real-world accuracy.

## Known limitations

- No data-flow or taint analysis anywhere. Every rule looks at a direct AST relationship at a single call/assignment site. A value built in one place and used in another is generally not tracked.
- No type checker. TypeScript syntax parses, but type information is never used by any rule.
- The SQL-injection rule is deliberately narrow (see table above) and will miss anything not shaped like `.query`/`.execute`/`.raw`/`.unsafe` with concatenation/interpolation directly at the call site.
- The secrets rule will miss custom/internal secret formats that don't match a known vendor prefix or a credential-shaped variable name.
- No input-size streaming/chunking: input above 500 KB is rejected outright rather than analyzed.
- PWA/offline behavior: the app shell is precached, but full offline functionality has not been independently verified across browsers — **NOT VERIFIED**, treat as best-effort.
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
```

Architecture notes, parser choice rationale, and the Web Worker design are documented in [`docs/architecture.md`](docs/architecture.md).
