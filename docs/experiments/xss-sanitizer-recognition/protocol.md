# Experimental Protocol — Narrow DOMPurify Recognition in XAUDIT's DOM-XSS Rule

Written and frozen before the experimental rule was implemented or the
corpus was scored. See [`baseline-system-description.md`](baseline-system-description.md)
for the exact baseline behavior this protocol is comparing against — notably,
baseline sanitizer recognition already exists and is broader/looser than
"none," which is why the hypothesis below is about *narrowing*, not
*introducing*, sanitizer recognition.

## Research question

> Can narrowly scoped recognition of explicit DOMPurify sanitizer calls
> reduce false positives in XAUDIT's DOM-XSS detection without increasing
> false negatives?

Restated precisely against what §4 of the baseline description found: XAUDIT's
current sanitizer recognition (`isSanitizerWrapped`) is a loose name-pattern
match (`sanitize`/`sanitizehtml`/`sanitizeHtml` as a bare call, or `.sanitize`
as a member call on **any** receiver). A narrower, structurally-verified
recognizer could either (a) reduce false positives on files that use real
DOMPurify calls in shapes the loose matcher already gets right, with no
change in outcome — the null-result case — or (b) change outcomes on the
loose matcher's over-broad paths, which by construction are false negatives
in a security sense (a real, unverified value gets a `low`-severity finding
instead of `high`) rather than false positives. Both are reported honestly.

## Hypothesis

> Recognizing direct `DOMPurify.sanitize(...)` calls immediately assigned to
> selected DOM-XSS sinks will reduce false positives in the experimental
> corpus without increasing false negatives.

## Null hypothesis

> Direct DOMPurify-call recognition does not improve precision without
> harming recall relative to XAUDIT's baseline DOM-XSS rule.

## Baseline (see baseline-system-description.md §3–4 for full detail)

- A sink finding is downgraded from `high` to `low` when the assigned value
  (directly, or one variable hop back) is a `CallExpression` matching:
  `<name matching /dompurify|xss|sanitize-html/i>.sanitize(...)`, OR any bare
  call to an identifier named exactly `sanitize`/`sanitizehtml`/`sanitizeHtml`,
  OR any member call whose property name is exactly `sanitize`
  (`<anything>.sanitize(...)`, receiver name unchecked).
- The finding is never suppressed — only downgraded.
- No detection of sanitize-then-concatenate, sanitize-then-overwrite, or
  sanitized output routed through an unknown mutator; these are not
  recognized as sanitized by baseline either (they fall through to `high`
  already, correctly, as a side effect of the one-hop resolver's
  reassignment/shape checks — not because of any misuse-specific logic).

## Experimental treatment

Implemented as a fully separate module (`xss-sanitizer-recognition.experimental.ts`,
§ Phase 5) that duplicates `xss.ts`'s sink-detection AST walk exactly and
replaces only the sanitizer-recognition predicate. Everything else —
sinks covered, one-hop resolution, severity defaults, the `javascript:`-URI
group — is byte-for-byte the same logic as baseline, so any metric difference
is attributable only to the recognition predicate.

The narrow predicate recognizes a sink value as "a recognized DOMPurify
sanitization pattern" only when, at the sink or after the existing one-hop
resolution:

- the call's callee is structurally `DOMPurify.sanitize(...)` — a
  `MemberExpression`, object is an `Identifier` literally named `DOMPurify`,
  property literally named `sanitize`, non-computed; **or**
- the callee is a bare `Identifier` whose binding is an `ImportDefaultSpecifier`
  from the literal module source `"dompurify"` (covers
  `import sanitizeHtml from "dompurify"; sanitizeHtml(x)`); **or**
- the callee is `<alias>.sanitize(...)` where `<alias>`'s binding is an
  `ImportNamespaceSpecifier` from the literal module source `"dompurify"`
  (covers `import * as DOMPurify from "dompurify"`, and any other namespace
  alias for that same import).

Explicitly **not** recognized, by design:

- an arbitrary local function/variable named `sanitize`, `sanitizeHtml`,
  `clean`, or `purify` with no verified `dompurify` origin;
- `<anything>.sanitize(...)` where `<anything>` is not the literal identifier
  `DOMPurify` and not a verified `dompurify` namespace import;
- a value that has been sanitized and then concatenated with, or overwritten
  by, additional unsanitized material (the sink's effective node in that case
  is a `BinaryExpression`/reassigned binding, never a bare sanitizer
  `CallExpression`, so it is structurally ineligible regardless of the
  predicate — same as baseline);
- a `javascript:` URI built dynamically elsewhere in the same file — the
  `javascript:`-URI checks are copied unchanged and never consult sanitizer
  recognition, in baseline or experimental;
- any indirection through a second variable hop, a destructured
  `const { sanitize } = DOMPurify` binding, a local alias
  (`const purifier = DOMPurify`), or a cross-file imported wrapper —
  all intentionally out of scope per the task's non-negotiable rules, and
  scored as disclosed limitations rather than silently treated as safe or
  unsafe.

A recognized case is downgraded to `severity: "low"` (matching baseline's
existing severity choice, so severity-based scoring is comparable) but with
distinct message wording:

> "A recognized DOMPurify sanitization call was found before this HTML sink.
> This may reduce risk, but review the sanitizer configuration and
> surrounding data flow. This result is not proof that the output is safe."

The finding is never labeled safe/clean/secure. See Phase 5 for the exact
finding shape.

## Metrics

Computed by (`ruleId`, `severity`) pair-matching against frozen ground truth,
the same multiset-match method `scripts/run-independent-benchmark.ts`
already uses elsewhere in this repo:

- True positives, false positives, false negatives, true negatives (a "true
  negative" case is a fixture with zero expected findings that produces
  zero actual findings)
- Precision = TP / (TP + FP), Recall = TP / (TP + FN), F1 = harmonic mean
- High/Critical findings, before vs. after
- Informational/low "recognized sanitizer" findings, before vs. after
- Parser errors (fixtures that fail to parse at all — scored separately,
  never folded into TP/FP/FN)
- Unsupported/ambiguous cases (fixtures whose ground truth is explicitly
  "neither implementation should claim safety here" — tracked by category,
  not scored as a pass/fail against a single expected severity)

## Decision criteria (fixed before implementation)

- A precision improvement requires **fewer false positives** in the scored
  set, not just a higher F1.
- No recall regression means **false negatives must not increase** on the
  frozen corpus, full stop — an F1 gain that comes with even one new false
  negative is not a successful safety improvement and is reported as such.
- A "recognized sanitizer" (`low`-severity) finding never counts as a true
  negative, and never counts as fully correct on its own — the corpus's
  `sanitized-misused/` category exists specifically to check that misuse
  cases are NOT downgraded; any misuse case that comes back `low` is scored
  as a false negative regardless of whether a `DOMPurify.sanitize` call is
  present somewhere in the file.
- Mixed results (e.g., precision improves on naming-shaped false positives
  but an intentionally-out-of-scope alias case also stops being recognized)
  are reported as mixed, not rounded up to "improvement."
- This experiment does not, and cannot, establish statistical significance —
  the corpus (~40 hand-authored cases) is far too small and not randomly
  sampled from real code. Results are reported as a case-by-case audit, not
  a statistical claim.
