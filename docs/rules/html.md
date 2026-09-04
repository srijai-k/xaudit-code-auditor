# HTML hygiene — `html.ts`

Source: [`src/lib/analysis/rules/html.ts`](../../src/lib/analysis/rules/html.ts) · Tests: [`tests/unit/html-rules.test.ts`](../../tests/unit/html-rules.test.ts) · Category: `html`

**Not AST, not security-grade.** Attribute/text presence checks over the raw markup string — there is no HTML parser in this module. Runs only when the input is analyzed in "HTML" mode. Severity here tops out at Medium (one check is deliberately Info-only) — presence/absence of an attribute is not proof of a vulnerability, only a hygiene gap. Unlike the other rule modules, this one isn't exercised through the shared fixture corpus (`tests/fixtures/`) — it has its own dedicated unit tests.

**Inline `<script>` content is also analyzed now, when it can be.** `analyze.ts` extracts every inline `<script>` block (external `src="..."` scripts and non-executable types like `application/json` are skipped) and attempts to parse each one on its own. A block that parses gets run through the same five real rules JS/TS/React mode uses — XSS, SQL injection, secrets, dynamic execution, Node.js command patterns — with each finding's line number shifted back to its real position in the document you pasted. A block that *can't* parse standalone (for example, one that depends on surrounding template syntax to be valid) falls back to `html-script-content-not-analyzed`, scoped to that specific block — never both for the same block, and other blocks in the same document are unaffected either way. This extraction/re-parse step is orchestrated in `analyze.ts`, not in this file — `html.ts` itself stays pure text scanning, per its own architecture.

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

**What it flags:** One inline `<script>` block, specifically the ones that could **not** be parsed as standalone JavaScript/TypeScript/JSX — for example, a block that relies on surrounding template syntax to be valid on its own. This exists to close a real, found gap: before any inline-script analysis existed, a user who manually selected HTML mode for content with real embedded JavaScript got a silent, clean "0 findings" report having never actually examined the script content with any of the five real detection rules. It's now scoped per-block rather than firing for the whole document: a block that *does* parse gets real findings from the actual rules instead of this disclosure (see the module intro above) — this finding only appears for the block(s) that genuinely couldn't be examined.

**Severity:** Info — purely a disclosure, not a claim that anything in the script is wrong.

**Risky (informational) example** — content that can't stand on its own outside its template:
```html
<script>
<% if (user) { %>
const greeting = "hi";
<% } %>
</script>
```
This produces `html-script-content-not-analyzed` for this block, since `<% ... %>` isn't valid JS syntax on its own. A block with genuinely parseable content — even one with a real bug, e.g. `<script>function leak() { return eval(location.hash); }</script>` — does **not** produce this finding; it produces a real `exec-eval` finding instead, with its line number matching the actual document.

**Safe examples:**
```html
<script src="/app.js"></script>          <!-- external script, nothing inline to miss — NOT flagged -->
<script>   </script>                       <!-- empty/whitespace-only — NOT flagged -->
<script type="application/json">{"a":1}</script>  <!-- not an executable script type — NOT parsed as JS -->
```

**Limitations:** A per-block fallback, not a claim about the script's content — if a document has several `<script>` blocks, only the ones that fail to parse get this finding; the rest are analyzed for real. Doesn't run at all if the input is analyzed as JS/TS/React instead of HTML.

**Tests:** `tests/unit/html-rules.test.ts` — "regression + feature: HTML mode now analyzes parseable inline `<script>` content (F-05)" describe block, exercised via `analyze()` (the extraction/re-parse/line-remap orchestration lives in `analyze.ts`, so these tests go through the real entry point rather than `runHtmlChecks()` alone). Full background in [`docs/self-audit-2026-09-03.md`](../self-audit-2026-09-03.md) finding F-05.
