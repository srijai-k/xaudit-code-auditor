# Direct Sanitizer Recognition in a Browser-Local DOM-XSS Static Checker

## Abstract

XAUDIT is a client-side, AST-based static analyzer that flags DOM-XSS sink
patterns (`innerHTML`, `dangerouslySetInnerHTML`, `document.write`, and
similar). It already recognizes an explicit sanitizer call at the sink and
downgrades the finding's severity rather than suppressing it — but that
recognition is a loose name-pattern match: any bare call named `sanitize`,
or any `<anything>.sanitize(...)` member call, is trusted regardless of
where it actually came from. This experiment asks whether narrowing that
recognition to a structurally-verified `DOMPurify.sanitize(...)` call (the
literal `DOMPurify` identifier, or an import binding traced to the literal
module `"dompurify"`) reduces false positives without increasing false
negatives. A frozen, 40-case, hand-authored corpus was scored against both
the unmodified production rule and an isolated experimental variant that
differs only in the recognition predicate. The narrow variant matched or
improved on the production rule on every case: precision and recall both
rose from 0.88 to 1.00, with zero remaining false positives or false
negatives on this corpus. The improvement traces to four specific,
name-based miscalibrations in the current rule — a same-file no-op function
merely named `sanitize`, an unrelated object's `.sanitize()` method, a
local variable aliased from `DOMPurify`, and a destructured `{ sanitize }`
binding — each of which the current implementation trusts by name alone.
This is a small, same-author, non-random corpus, and the result should be
read as a targeted fix for a specific known miscalibration, not as general
evidence that sanitizer recognition is reliable.

## 1. Motivation

A DOM-XSS checker with a name-based sanitizer allowlist faces two opposite
failure modes. Recognize too little, and every legitimately sanitized call
site still shows up as a high-severity finding — noise that erodes trust in
the tool and trains developers to skim past real findings. Recognize too
much, and a finding that should stay urgent gets quietly downgraded,
producing exactly the false confidence a security tool must never create.
XAUDIT's existing sanitizer recognition already leans toward the second
failure mode in two specific, disclosed-but-unaddressed ways: it trusts a
bare `sanitize(...)` call and any `.sanitize(...)` member call by name
alone, with no check on where that function came from. Narrowing
recognition to a verified `DOMPurify` call is only useful if it removes
that false-confidence risk without also losing real positives — hence a
measured experiment rather than a drive-by fix.

## 2. Research Question and Hypothesis

See [`protocol.md`](protocol.md) for the full, pre-registered statement.
In short: does narrow, structural `DOMPurify.sanitize(...)` recognition
reduce false positives without increasing false negatives, relative to
XAUDIT's existing broader recognition?

## 3. Baseline System

Full detail in [`baseline-system-description.md`](baseline-system-description.md).
XAUDIT's DOM-XSS rule (`src/lib/analysis/rules/xss.ts`) flags a sink
(`innerHTML`/`outerHTML`/`srcdoc`/`insertAdjacentHTML`/`document.write`/
`writeln`/`dangerouslySetInnerHTML`/jQuery `.html()`) whenever its value
isn't provably a static string, checked either directly or through exactly
one same-scope variable hop (`resolveSingleAssignment`) — never crossing a
function boundary, never chasing a second hop. If the resolved value
matches `isSanitizerWrapped` (`ast-utils.ts`), the finding is downgraded
from `high` to `low`, never suppressed. `isSanitizerWrapped` recognizes,
by name alone: `<name matching /dompurify|xss|sanitize-html/i>.sanitize(x)`
(the intended case), any bare `sanitize`/`sanitizehtml`/`sanitizeHtml(x)`
call regardless of origin, and any `<anything>.sanitize(x)` member call
regardless of the receiver's name.

## 4. Method

- **Frozen corpus**: 40 hand-authored cases across 8 categories (`unsafe`,
  `react`, `jquery`, `sanitized-direct`, `aliases`, `sanitized-misused`,
  `safe-literal`, `ambiguous`), committed and tagged
  (`experiment/xss-sanitizer-corpus-frozen`) before the experimental rule
  was written. See `tests/experiments/xss-sanitizer-recognition/fixtures/`.
- **Ground truth**: one objectively-correct expected outcome per case
  (`ground-truth.json`), written before either implementation was scored
  against it, with a stated rationale per case. 6 cases are marked
  `ambiguousOrUnsupported` — deliberate out-of-scope shapes (local aliasing
  of the `DOMPurify` identifier, destructuring, cross-file wrappers,
  conditional use) where "fail safe" (stay `high`) is itself the correct
  answer, tracked separately so a disclosed recognition gap is never
  conflated with a vulnerability-detection failure.
- **Baseline vs. experimental implementation**: `run-baseline.ts` runs the
  real, unmodified `xss.ts`. `run-experiment.ts` runs an isolated fork,
  `src/lib/analysis/rules/xss-sanitizer-recognition.experimental.ts`, which
  duplicates every sink/one-hop/`javascript:`-URI code path verbatim and
  changes only the sanitizer-recognition predicate. Neither script, nor the
  scorer, imports from the other's implementation.
- **Metrics**: `score-results.ts` performs a `(ruleId, severity)` multiset
  match per case (the same method `scripts/run-independent-benchmark.ts`
  already uses elsewhere in this repo) and computes TP/FP/FN/TN, precision,
  recall, F1, high/critical counts, recognized-sanitizer (`low`) counts,
  and parser-error/ambiguous-case tallies, kept separate from the main
  precision/recall figures.
- **Rule design**: pure AST structure via `@babel/types` predicates and
  Babel's own scope/binding resolution (`path.scope.getBinding`) to verify
  an import's real module source — never a text or regex match on an
  import statement.
- **No-network/local-analysis constraint**: unaffected by this experiment.
  The experimental module is not registered in `analyze.ts`, is not
  imported by any UI code, and does not appear in the production bundle —
  confirmed by `npm run build` producing an identical `worker-*.js` chunk
  size to the pre-experiment build.

## 5. Results

| Metric | Baseline | Experimental | Difference |
|---|---:|---:|---:|
| TP | 28 | 32 | +4 |
| FP | 4 | 0 | -4 |
| FN | 4 | 0 | -4 |
| TN | 8 | 8 | +0 |
| Precision | 0.88 | 1.00 | +0.13 |
| Recall | 0.88 | 1.00 | +0.13 |
| F1 | 0.88 | 1.00 | +0.13 |
| High/Critical findings | 20 | 24 | +4 |
| Recognized-sanitizer (low) findings | 12 | 8 | -4 |
| Parser errors | 1 | 1 | +0 |
| Ambiguous/unsupported cases correct (of 6) | 4 | 6 | +2 |

(Full case-by-case table: `results/comparison.md`.)

All four disagreements between baseline and experimental are false
positives *removed* — no case moved in the unsafe direction (`high` → `low`
incorrectly), and no previously-correct `high` case became a false `low`.
Every unsafe, sanitized-direct, sanitized-misused, safe-literal, and
already-conservative ambiguous case that baseline got right, experimental
also got right:

- **Case 21** (`sanitized-misused/fake-local-sanitize-function.js`): a
  same-file no-op function named `sanitize`. Baseline: `low` (wrong).
  Experimental: `high` (correct).
- **Case 22** (`sanitized-misused/unrelated-object-sanitize-method.js`): an
  unrelated `object.sanitize()` method that doesn't remove HTML. Baseline:
  `low` (wrong). Experimental: `high` (correct).
- **Case 34** (`aliases/renamed-local-alias.js`): `const purifier =
  DOMPurify; purifier.sanitize(x)`. Baseline: `low` (accidentally correct in
  substance here, since it really is DOMPurify — but only by name-pattern
  luck, not by verifying the alias). Experimental: `high` (fails safe,
  since it does not resolve local aliases of the identifier itself — a
  disclosed, deliberate scope limit, not a claim this code is unsafe).
- **Case 36** (`aliases/destructured-sanitize.js`): `const { sanitize } =
  DOMPurify; sanitize(x)`. Same pattern as case 34 for destructuring.

## 6. Failure Analysis

- **Sanitizer misuse** (concatenation after sanitizing, a second unsanitized
  value injected, sanitize-then-overwrite, sanitized output passed through
  an unknown mutator): all 5 relevant corpus cases (18, 19, 23, 24, 25) were
  already handled correctly by baseline, because the misuse reliably
  changes the sink's effective AST shape to something that is never a bare
  sanitizer `CallExpression` (a `BinaryExpression`, a reassigned binding, or
  a call to an unrelated function). Neither implementation's sanitizer
  *name* scope is what protects these cases — the one-hop resolver's
  existing shape/constant checks do. This experiment did not need to add
  misuse-specific logic, but it also does not remove any of that existing
  protection.
- **Aliases**: the narrow implementation intentionally does not resolve a
  local variable aliased from `DOMPurify` itself (case 34), a destructured
  `{ sanitize }` binding (case 36), or an extracted function reference
  (`const clean = DOMPurify.sanitize`, case 35). All three fail safe
  (stay `high`), which is the objectively correct default when recognition
  is uncertain — but it is a real, disclosed regression in *recognition*
  recall on two cases (34, 36) where baseline happened to get the right
  answer for the wrong reason (matching the bare name `sanitize` or the
  string `dompurify` regardless of actual origin).
- **Wrappers**: a cross-file imported wrapper (case 37) and a same-file
  helper function that calls `DOMPurify.sanitize()` internally but is
  itself the thing invoked at the sink (case 39) are not resolved by either
  implementation — correct, conservative behavior neither implementation
  claims credit for beyond "it doesn't get this wrong."
- **Cross-file flows**: entirely out of scope for both implementations, by
  design — see case 37.
- **Configuration blindness**: neither implementation, baseline or
  experimental, has any way to inspect what a recognized `DOMPurify.sanitize`
  call is actually configured to allow (`ALLOWED_TAGS`, `ALLOWED_ATTR`, a
  loosened `ALLOW_DATA_ATTR`, etc.). A recognized call with an unsafe
  configuration reads identically to one with a safe configuration.
- **Post-sanitization mutation**: covered directly by case 25 (sanitized
  output through an unknown mutator) — both implementations correctly
  decline to trust it, but only because the mutator call is a different
  `CallExpression` at the sink, not because either implementation
  understands "mutation" as a concept.
- **`javascript:` URI handling**: verified independent of sanitizer
  recognition by case 20, which pairs a genuinely-sanitized `innerHTML`
  sink with a separate, dynamically-built `javascript:` URI sink in the
  same file — both implementations correctly keep the URI finding at
  `high` regardless of the unrelated sanitized sink.
- **Why DOMPurify recognition cannot prove safety, even when improved**:
  every mechanism above that a narrow, structural check does NOT and cannot
  verify — configuration, aliasing beyond imports, cross-file flow,
  post-sanitization mutation — remains true after this experiment. The
  improvement measured here is entirely about not trusting sanitizer-shaped
  code that isn't DOMPurify at all; it says nothing new about whether a
  verified DOMPurify call is itself safe in context.

## 7. Threats to Validity

- **The corpus is authored by the project developer** (via this
  assistant), not by an independent party. No case's ground truth has been
  reviewed by anyone outside this project — see
  [`external-review-request.md`](external-review-request.md), which is
  still an open request, not a completed review.
- **Limited sample size.** 40 cases is enough to characterize specific,
  named failure modes precisely, not to estimate a real-world false
  positive/negative rate. No confidence interval or significance test is
  reported because none would be meaningful at this size.
- **No external ground-truth review has been obtained.** The three
  questions in `external-review-request.md` are unanswered as of this
  report.
- **The tool supports only narrow syntax/data-flow patterns** to begin
  with (one-hop resolution, no cross-file analysis) — this experiment
  operates entirely within that existing ceiling and does not raise it.
- **The benchmark may not generalize to production code.** Real codebases
  mix sanitizer usage patterns (config objects passed to `.sanitize()`,
  wrapped/memoized sanitizer instances, sanitizers imported under build
  tools this parser doesn't model) that this corpus does not attempt to
  exhaustively sample.

## 8. Conclusion

**The hypothesis is supported on this corpus.** Narrow, structural
DOMPurify recognition matched baseline on every case where baseline was
already correct, and corrected all four cases where baseline's looser
name-based matching produced a false `low`-severity downgrade — with zero
new false negatives and zero new false positives introduced anywhere in
the 40-case corpus. The improvement is small in absolute count (4 cases)
and concentrated in a specific, previously-undocumented failure mode
(trusting a bare `sanitize`/`.sanitize()` call by name alone) rather than
sanitizer recognition in general. It does not extend to, or make any claim
about, sanitizer configuration correctness, cross-file wrappers, or
post-sanitization mutation — all of which remain unverified by design in
both implementations.

## 9. Reproducibility

```bash
# From the xaudit-code-auditor repository root:
npx tsx tests/experiments/xss-sanitizer-recognition/run-baseline.ts
npx tsx tests/experiments/xss-sanitizer-recognition/run-experiment.ts
npx tsx tests/experiments/xss-sanitizer-recognition/score-results.ts compare

# Unit tests for the experimental rule module:
npx vitest run tests/unit/xss-sanitizer-recognition.experimental.test.ts

# Full project verification run alongside this experiment:
npx tsc --noEmit -p tsconfig.json
npx vitest run
npm run build
npm run test:e2e
```

Outputs land in `tests/experiments/xss-sanitizer-recognition/results/`:
`baseline-results.json`, `baseline-metrics.json`,
`experimental-results.json`, `experimental-metrics.json`, `comparison.md`.
The frozen corpus and baseline results are additionally preserved at git
tag `experiment/xss-sanitizer-corpus-frozen`, from before the experimental
rule existed.

## 10. Ethics and Safe Use

Every fixture in this corpus is synthetic — invented function/variable
names, no real user data, no real API keys or credentials, no code copied
from any real project. This experiment analyzes source code text only,
entirely client-side, with no network access and no interaction with any
system, application, or account the author does not own. It does not scan,
probe, or test any third party's software, service, or infrastructure.
