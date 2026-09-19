# XSS Sanitizer Recognition Experiment — Corpus

Frozen, hand-authored corpus (not derived from `tests/fixtures/` or
`tests/independent-benchmark/`) for the research question in
[`docs/experiments/xss-sanitizer-recognition/protocol.md`](../../../docs/experiments/xss-sanitizer-recognition/protocol.md):
can narrowly-scoped, structural recognition of `DOMPurify.sanitize(...)`
calls reduce false positives in XAUDIT's DOM-XSS rule without increasing
false negatives?

**This corpus and `ground-truth.json` were frozen (tagged
`experiment/xss-sanitizer-corpus-frozen`) before the experimental rule in
`src/lib/analysis/rules/xss-sanitizer-recognition.experimental.ts` was
written**, and have not been edited since — see the frozen commit/tag for
proof.

## Layout

```
fixtures/
  unsafe/             — 8 cases, must always stay high severity, no sanitizer anywhere
  react/              — 4 cases (raw, DOMPurify-direct, plain children, onClick)
  jquery/             — 1 case, jQuery .html() with dynamic input
  sanitized-direct/   — 4 cases, DOMPurify.sanitize() directly/one-hop at the sink
  aliases/            — 5 cases, import aliases + local-variable/destructuring aliases
  sanitized-misused/  — 8 cases, a sanitizer call exists somewhere but must NOT clear the sink
  safe-literal/       — 6 cases, no dynamic HTML sink at all
  ambiguous/          — 4 cases, disclosed out-of-scope shapes (cross-file, conditional, parse error)
ground-truth.json      — one objectively-correct expected outcome per case, written before the
                          experimental rule existed
run-baseline.ts         — runs the real, unmodified src/lib/analysis/rules/xss.ts
run-experiment.ts       — runs the isolated experimental variant
score-results.ts        — the one scorer both feed; also writes results/comparison.md
results/                — baseline-results.json / -metrics.json, experimental-results.json / -metrics.json, comparison.md
```

40 cases total; case-by-case rationale for every one is in `ground-truth.json`.

## Reproducing

```bash
npx tsx tests/experiments/xss-sanitizer-recognition/run-baseline.ts
npx tsx tests/experiments/xss-sanitizer-recognition/run-experiment.ts
npx tsx tests/experiments/xss-sanitizer-recognition/score-results.ts compare
```

`results/comparison.md` and the two `*-metrics.json` files are the direct
output of the commands above, not hand-edited.

## What this corpus is not

Not a random sample of real-world code, not third-party-authored, and not
large enough to claim statistical significance — see
[`docs/experiments/xss-sanitizer-recognition/report.md`](../../../docs/experiments/xss-sanitizer-recognition/report.md)
§7 (Threats to Validity) for the full, honest list of limits.
