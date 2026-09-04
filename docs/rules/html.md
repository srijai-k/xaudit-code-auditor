# HTML hygiene — `html.ts`

Source: [`src/lib/analysis/rules/html.ts`](../../src/lib/analysis/rules/html.ts) · Tests: [`tests/unit/html-rules.test.ts`](../../tests/unit/html-rules.test.ts) · Category: `html`

**Not AST, not security-grade.** Attribute/text presence checks over the raw markup string — there is no HTML parser in this engine. Runs only when the input is analyzed in "HTML" mode. Severity here tops out at Medium (one check is deliberately Info-only) — presence/absence of an attribute is not proof of a vulnerability, only a hygiene gap. Unlike the other rule modules, this one isn't exercised through the shared fixture corpus (`tests/fixtures/`) — it has its own dedicated unit tests.

---

## html-missing-viewport

**What it flags:** A full HTML document (`<html...>` present) with no `<meta name="viewport" ...>` tag.

**Severity:** Medium.

**Why it matters:** Without it, mobile browsers render the page at desktop width, breaking responsive layout — a UX/rendering issue, not a security issue.

**Tests:** `tests/unit/html-rules.test.ts` — "flags a missing viewport meta tag on a full document" / "does not flag viewport when present"

---

## html-missing-alt

**What it flags:** `<img>` tags with no `alt` attribute, or an empty one.

**Severity:** Low.

**Why it matters:** Screen readers can't describe the image — an accessibility issue, not a security issue.

**Tests:** `tests/unit/html-rules.test.ts` — "flags images missing alt text"

---

## html-inline-event-handler

**What it flags:** A literal inline HTML event-handler attribute — `onclick="..."` with an actual quote immediately after `=`. Deliberately quote-anchored so it can never match a JSX `onClick={handler}` prop, even though this module only ever runs on markup classified as HTML mode in the first place (a defensive second layer, not the only thing preventing that confusion).

**Severity:** Medium.

**Risky example:** `<button onclick="doStuff()">Go</button>`

**Safe example:** `<button onClick={handleClick}>Go</button>` — JSX, never matched (this module never inspects JSX at all).

**Limitations:** Presence check only — doesn't know whether this markup is ever built from untrusted input.

**Tests:** `tests/unit/html-rules.test.ts` — "flags a real inline HTML event handler with a literal quote" / "never treats JSX onClick={...} as an inline HTML event handler"

---

## html-missing-csp-meta

**What it flags:** A full HTML document with no `<meta http-equiv="Content-Security-Policy" ...>` tag.

**Severity:** Info — the lowest confidence in this module. A CSP is far more commonly and effectively delivered as an HTTP response header, which this checker can never see (it only ever sees pasted markup text, never real server headers) — so this finding's absence or presence is weak signal either way, explicitly framed as a reminder, not a claim about actual deployed security posture.

**Tests:** covered by `tests/unit/html-rules.test.ts`'s severity-ceiling assertion ("every finding tops out at medium severity") — no dedicated positive-case test beyond that, since the check itself is simple presence/absence symmetric with `html-missing-viewport`.

---

## html-script-content-not-analyzed

**What it flags:** A non-trivial inline `<script>` block (real content, not just `<script src="...">`) when the input is being analyzed in HTML mode. This exists to close a real, found gap: before it existed, a user who manually selected HTML mode for content with real embedded JavaScript (e.g. a Vue single-file component) got a silent, clean "0 findings" report having never actually examined the script content with any of the other six real detection rules.

**Severity:** Info — purely a disclosure, not a claim that anything in the script is wrong.

**Risky (informational) example:**
```html
<template><div>{{ msg }}</div></template>
<script>
export default { data() { return { msg: eval(location.hash) } } }
</script>
```
This produces exactly one finding: `html-script-content-not-analyzed`. The `eval()` inside is real and dangerous, but it was never examined — switching to "JS/TS/React" mode would catch it.

**Safe examples:**
```html
<script src="/app.js"></script>          <!-- external script, nothing inline to miss — NOT flagged -->
<script>   </script>                       <!-- empty/whitespace-only — NOT flagged -->
```

**Limitations:** Presence check only (does a `<script>` tag have non-empty inline content) — does not itself analyze the script content in any way, and never runs at all if the input is analyzed as JS/TS/React instead of HTML.

**Tests:** `tests/unit/html-rules.test.ts` — "regression: HTML mode discloses when it isn't analyzing real script content (F-05)" describe block. Full background in [`docs/self-audit-2026-09-03.md`](../self-audit-2026-09-03.md) finding F-05.
