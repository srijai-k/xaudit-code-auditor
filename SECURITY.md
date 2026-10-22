# Security Policy

## Scope

This covers security issues in **XAUDIT itself** — the checker application, its build/deploy configuration, and its dependencies. It does not cover the code you paste into the checker; findings the tool produces about your code are pattern matches for you to evaluate, not vulnerability reports about XAUDIT.

## What counts as a security issue here

- A way for pasted/typed code to be executed by the app itself (the app must never `eval`, `new Function`, or otherwise run user-supplied code — it only parses and pattern-matches it).
- An XSS, injection, or data-exfiltration path in the app's own UI, PDF export, or local-storage handling.
- A way for the analysis engine to make a network request of any kind.
- A dependency with a known CVE that's reachable from the shipped bundle.
- A CSP/security-header regression in `vercel.json` / `vite.config.js`.

## What is a false-negative/false-positive report, not a security issue

If XAUDIT fails to flag a real vulnerability in your own code, or flags something that isn't one, that's a **detection-quality bug**, not a security vulnerability in XAUDIT. Please still report it — open a regular GitHub issue with a minimal reproduction, and reference the relevant rule module under `src/lib/analysis/rules/`. Detection-quality issues are tracked in `docs/benchmark-report.md` and the `tests/` corpus, not through the process below.

## Reporting a security issue

Please **do not** open a public GitHub issue for a security vulnerability in the app itself. Instead:

1. Open a private security advisory on this repository (GitHub → **Security** → **Report a vulnerability**).
2. Include: the affected file/component, a minimal reproduction, and the impact you believe it has (confidentiality/integrity/availability/trust — see the categories used in `docs/baseline-audit.md`).
3. We will acknowledge the report and work with you on a fix and disclosure timeline before any public write-up.

## Dependency updates

Production dependencies are kept minimal on purpose (`@babel/parser`, `@babel/traverse`, `@babel/types`, `framer-motion`, `jspdf`, `lucide-react`, `react`, `react-dom`, plus `react-router-dom`). `npm audit --omit=dev` is run in CI on every push/PR and must pass with zero vulnerabilities; see `docs/baseline-audit.md` and the implementation report for historical status. If this repository has Dependabot (or an equivalent) configured, update PRs from it should be reviewed and merged promptly for any `high`/`critical` advisory in a production dependency.

### Third-party code shipped transitively, not directly declared

`jspdf` bundles `DOMPurify` (~29 KB) and `html2canvas` (~201 KB) as dependencies of its optional `.html()` (HTML-to-canvas) rendering feature. This app's own PDF export (`src/lib/export/pdf-generator.ts`) never calls that feature — it only uses jsPDF's primitive vector-drawing API — but both libraries still ship as separate chunks in every production build (`npm run build`; visible under `dist/assets/`), since jsPDF bundles them unconditionally. Neither is imported anywhere in this project's own source, and neither is reachable from any code path this app exposes. This is disclosed here because a review of `package.json` alone would miss it — anyone auditing the actual shipped bundle contents should expect to see these two chunks and know why. If jsPDF is ever swapped for an alternative, or a build path that tree-shakes its `.html()` feature is found, this note should be updated or removed accordingly.
