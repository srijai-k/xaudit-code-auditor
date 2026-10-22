# External Review Request — Narrow DOMPurify Recognition in a DOM-XSS Static Checker

**Status: not yet reviewed by anyone outside this project.** This document
is the request itself, written to be sent to an outside reviewer (a
security engineer, a CS instructor, a peer). No reviewer feedback is
reflected anywhere in this experiment's code, corpus, or report — if that
changes, this line and the rest of this document will be updated to say
who reviewed it and what they said, not silently removed.

## Research question

Can narrowly scoped recognition of explicit `DOMPurify.sanitize(...)` calls
reduce false positives in a client-side, AST-based DOM-XSS static checker
(XAUDIT) without increasing false negatives?

## Hypothesis

Recognizing direct `DOMPurify.sanitize(...)` calls immediately assigned to
selected DOM-XSS sinks will reduce false positives in a frozen 40-case test
corpus without increasing false negatives, relative to the tool's existing
(broader, name-pattern-only) sanitizer recognition.

## Exact scope

- Sinks: `innerHTML`/`outerHTML`/`srcdoc` assignment, `insertAdjacentHTML`,
  `document.write`/`writeln`, React `dangerouslySetInnerHTML`, jQuery
  `.html()` on a recognizably jQuery-sourced receiver — the DOM-XSS sinks
  XAUDIT already supports, no new sinks added.
- Recognition: only a structurally-verified `DOMPurify.sanitize(...)` call
  (literal `DOMPurify` identifier, or an import binding traced to the
  literal module `"dompurify"`), directly at the sink or one existing
  variable hop back. No cross-file resolution, no wrapper-function
  resolution, no name-only heuristics.
- Explicitly out of scope: SQL injection, any cross-file/interprocedural
  analysis, new framework support, and any claim that a recognized call
  proves the output is safe.

## Corpus categories (40 cases, frozen before the rule was implemented)

`unsafe/` (8), `react/` (4), `jquery/` (1), `sanitized-direct/` (4),
`aliases/` (5), `sanitized-misused/` (8), `safe-literal/` (6),
`ambiguous/` (4) — full list and rationale for each case in
`tests/experiments/xss-sanitizer-recognition/ground-truth.json`.

## Proposed treatment

A recognized sink is downgraded from `high` to `low` severity with wording
that explicitly refuses to claim safety:

> "A recognized DOMPurify sanitization call was found before this HTML
> sink. This may reduce risk, but review the sanitizer configuration and
> surrounding data flow. This result is not proof that the output is
> safe."

## Key risk

**Incorrectly treating sanitizer recognition as proof of safety.** DOMPurify
can be misconfigured (an overly permissive `ALLOWED_TAGS`/`ALLOWED_ATTR`),
called on the wrong value, called before a second, unsanitized value is
concatenated in, or its output can be mutated afterward — none of which a
syntax-level AST check can see. A user (or a future contributor) skimming a
`low`-severity finding could reasonably read it as "handled," which is
exactly the false-confidence failure mode this whole experiment exists to
avoid introducing.

## Three questions for a reviewer

1. Is direct recognition of `DOMPurify.sanitize(...)` a reasonable narrowly
   scoped treatment, or is the expected risk of false confidence too high
   for a tool like this to ship, even behind cautious wording?
2. Which sanitizer-misuse cases are missing from the frozen corpus (see
   `sanitized-misused/` and `ambiguous/` in `ground-truth.json`)? The
   current set covers: post-sanitize concatenation, a second unsanitized
   value injected alongside a sanitized one, sanitizing HTML while missing
   a separate `javascript:`-URI sink, a same-name fake local sanitizer, an
   unrelated `.sanitize()` method, sanitize-then-overwrite, an unconnected
   real DOMPurify call elsewhere in the file, and sanitized output passed
   through an unknown mutator.
3. Should a recognized sanitizer call produce an informational finding, a
   lower-severity finding (as currently implemented, `low`), or should it
   remain high severity with only the wording changed to add context?

No reviewer relationship is claimed in any product copy, README wording, or
elsewhere in this repository unless and until an actual reviewer responds
here.
