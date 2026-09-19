# XAUDIT Release Readiness Checklist

Generated alongside `docs/full-engineering-report-2026-09-05.md` (commit `7f2e517`). Every row is evidence-based — see that report's numbered sections for the underlying detail. Re-run this checklist any time before a release; do not hand-wave a row without re-executing its command.

## How to use this checklist

Run each command yourself and compare against the "Expected" column. A row is only ✅ if you actually ran it and it matched — not because it matched the last time someone else ran it.

## Blocking (must be green before any public release)

| # | Check | Command | Expected | Status as of 2026-09-05 |
|---|---|---|---|---|
| 1 | Unit/regression/rule test suite | `npm test -- --run` | All test files pass, 0 failures | ✅ **22 files, 213 tests, all passing** (8.05s) |
| 2 | Production build succeeds | `npm run build` | Exits 0, produces `dist/` | ✅ Succeeded (23.20s) |
| 3 | Production dependency audit | `npm audit --omit=dev` | Exits 0, 0 vulnerabilities | ❌ **FAILS — exit code 1, 1 moderate (`fflate@0.8.2` via `jspdf@4.2.1`, GHSA-px8p-9vwx-vf98)** — this is the exact command CI runs with no `continue-on-error`; **do not release until this is 0** |
| 4 | No network primitive in `src/` | `grep -rnE "fetch\(\|new XMLHttpRequest\(\|new WebSocket\(" src/` | 0 matches | ✅ 0 matches |
| 5 | Runtime network-trap regression test | `npm test -- tests/regression/no-network-at-runtime.test.ts` | Passes | ✅ Passes (included in row 1's full run) |
| 6 | Playwright e2e — real-browser zero-network proof | `npm run build && npx playwright install --with-deps chromium && npm run test:e2e` | Passes | ⚠️ **UNVERIFIED — not run in this audit's environment.** Run this before release; do not assume it passes just because it did historically. |
| 7 | Benchmark corpora regenerate with no diff | `npm run bench && npm run bench:independent && git diff --stat docs/*benchmark*.md` | No diff beyond the `Generated:` timestamp line | ✅ Regenerated this session, matched committed reports exactly (only timestamp differed; discarded) |

## High priority (should be green; document explicitly if not)

| # | Check | Command | Expected | Status as of 2026-09-05 |
|---|---|---|---|---|
| 8 | Full `npm audit` reviewed (incl. dev) | `npm audit` | Every finding triaged (prod vs. dev-only, reachable vs. not) | ✅ Reviewed — `esbuild` and `@humanfs/node` are dev-only, correctly out of scope for the shipped bundle |
| 9 | Undisclosed transitive bundle content documented | Manual: `npm run build`, inspect `dist/assets/` for unexpected chunks | Every shipped chunk traceable to a documented dependency | ❌ **Not yet documented** — `purify.es-*.js` (DOMPurify, 28.74 kB) and `html2canvas.esm-*.js` (201.04 kB) ship via `jspdf`, unused by this project's own PDF code, mentioned in no current doc |
| 10 | Lint | `npm run lint` | 0 errors in live (non-dead-code) `src/` files | ❌ 60 problems total; ~5 real files in live `src/` affected (`PageTransition.jsx`, `HistoryDrawer.jsx`, `CheckerPage.jsx`, `DocsPage.jsx`, `LandingPage.jsx`) plus dead-code and benchmark-fixture noise. **Not currently gated by CI at all.** |
| 11 | Dead/orphaned code removed | `grep -rln "<ComponentName>" src/` for each suspect file | 0 matches for anything about to be deleted, confirming it's truly unused | ❌ 4 confirmed-dead files/groups still present (see report §11A) |
| 12 | Security headers verified against a live deployment | `curl -I <deployed-url>` | Matches `vercel.json` exactly | ⚠️ Not verified by this audit (no live deployment URL available); last verified per `DEPLOY.md` against local `npm run preview` only |
| 13 | Type-check | *(no script exists)* | N/A until added | ❌ No `tsconfig.json`, no typecheck step anywhere |

## Documentation

| # | Check | Expected | Status as of 2026-09-05 |
|---|---|---|---|
| 14 | README capability table matches `analyze.ts`'s actual rule set | 8 modules listed, matching `SCRIPT_RULES` + `dependency-hygiene` + `html` | ✅ Matches |
| 15 | README/SECURITY.md disclose the Vercel-specific header dependency | Explicit paragraph present | ✅ Present in `DEPLOY.md` |
| 16 | README/SECURITY.md disclose the transitively-bundled DOMPurify/html2canvas | Explicit paragraph present | ❌ Not present anywhere |
| 17 | Every `ruleId` has a stable docs anchor (SARIF `helpUri` target) | `tests/unit/rule-docs-coverage.test.ts` passes | ✅ Passes (included in row 1) |
| 18 | Self-audit / benchmark docs carry their own accuracy-scope caveats | Present verbatim in both `docs/benchmark-report.md` and `docs/independent-benchmark-report.md` headers | ✅ Present and accurate |
| 19 | No prohibited claim appears anywhere in shipped copy | Manual grep for each term in `docs/implementation-inventory.json`'s `prohibitedClaims` list, across `src/`, `README.md`, `docs/` | ✅ None found active (only inside historical `docs/baseline-audit.md`, correctly framed as "what the *old* product falsely claimed") |

## Sign-off

Do not mark this checklist "release ready" until every row in **Blocking** is ✅ and every row in **High priority** is either ✅ or has an explicit, dated, accepted-risk note attached (not a silent skip).

**Current overall status: NOT release ready** — blocking row #3 (`npm audit --omit=dev`) is red, and blocking row #6 (Playwright e2e) is unverified rather than confirmed green.
