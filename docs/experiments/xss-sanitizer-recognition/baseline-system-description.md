# Baseline System Description — DOM-XSS Rule and Sanitizer Recognition

Written before any code for this experiment was changed. Every claim below was
verified by reading the exact files cited, not from memory of the wider audit.

## 1. Exact existing DOM-XSS rule IDs

All produced by one rule module, [`src/lib/analysis/rules/xss.ts`](../../../src/lib/analysis/rules/xss.ts),
registered as `xssRule` (`id: "xss"`, `category: "xss"`) in
[`analyze.ts`](../../../src/lib/analysis/analyze.ts)'s `SCRIPT_RULES` list. Individual
findings carry their own, more specific `ruleId`:

| ruleId | Sink |
|---|---|
| `xss-inner-html` | `x.innerHTML = expr` |
| `xss-outer-html` | `x.outerHTML = expr` |
| `xss-iframe-srcdoc` | `x.srcdoc = expr` |
| `xss-insert-adjacent-html` | `x.insertAdjacentHTML(pos, expr)` |
| `xss-document-write` | `document.write(expr)` |
| `xss-document-writeln` | `document.writeln(expr)` |
| `xss-dangerously-set-inner-html` | React `dangerouslySetInnerHTML={{ __html: expr }}`, including one variable hop to the whole props object |
| `xss-jquery-html` | `x.html(expr)` where `x` is recognizably jQuery/jqLite-sourced |
| `xss-location-javascript-uri` | `javascript:` URI literal concatenated/interpolated and assigned to `location`/`location.href`/`window.location`/`document.location` |
| `xss-setattribute-javascript-uri` | same, passed to `el.setAttribute('href'\|'src', ...)` |
| `xss-jsx-href-javascript-uri` | same, in a JSX `href`/`src` prop |

## 2. Supported sinks

Exactly the set in the table above. Sinks explicitly and permanently out of
scope: JSX event props (`onClick`, `onChange`, `onSubmit`, …), jQuery's
`.append`/`.prepend`/`.after`/`.before`/`.replaceWith` (deliberately excluded —
usually called with an element reference, not a string), and any `javascript:`
URI held in a variable rather than written as a literal scheme in the same
expression.

## 3. What currently counts as a finding

For the HTML-sink group (`innerHTML`/`outerHTML`/`srcdoc`/`insertAdjacentHTML`/
`document.write`/`writeln`/`dangerouslySetInnerHTML`/jQuery `.html()`), a
finding fires whenever the assigned/passed value is not provably a static
string — checked via `isStaticStringExpression` (a literal, or a template
literal with zero `${}` interpolations) either directly at the sink or after
one same-scope variable hop (`resolveSingleAssignment`, see §5). If the
resolved value passes a **sanitizer-shape check** (`isSanitizerWrapped`, see
§4), the finding still fires, but at `severity: "low"` instead of `"high"` —
sanitizer recognition downgrades, it never suppresses a finding outright. This
is a real, already-implemented design decision documented directly in
`ast-utils.ts`'s doc comment for `isSanitizerWrapped`.

For the `javascript:`-URI group, sanitizer recognition is not consulted at
all — that group only checks for the literal `javascript:` scheme string
being present in a concatenation/template literal.

## 4. Whether any sanitizer recognition already exists

**Yes — and it is broader than "no sanitizer recognition," which changes the
framing of this whole experiment.** It lives in
[`src/lib/analysis/ast-utils.ts`](../../../src/lib/analysis/ast-utils.ts), `isSanitizerWrapped`:

```ts
const SANITIZER_CALLEE_NAMES = new Set(["sanitize", "sanitizehtml", "sanitizeHtml"]);
const SANITIZER_OBJECT_NAME_PATTERN = /dompurify|xss|sanitize-html/i;

export function isSanitizerWrapped(node: t.Node): boolean {
    if (!t.isCallExpression(node)) return false;
    const callee = node.callee;
    if (t.isMemberExpression(callee) && !callee.computed) {
        const objectName = t.isIdentifier(callee.object) ? callee.object.name : "";
        const propName = t.isIdentifier(callee.property) ? callee.property.name : "";
        if (SANITIZER_OBJECT_NAME_PATTERN.test(objectName) && /sanitize/i.test(propName)) return true;
        if (SANITIZER_CALLEE_NAMES.has(propName)) return true;
    }
    if (t.isIdentifier(callee) && SANITIZER_CALLEE_NAMES.has(callee.name)) return true;
    return false;
}
```

Read exactly, this recognizes, and downgrades to `low`:

- `DOMPurify.sanitize(x)`, `xss(x)`-shaped or `sanitize-html`-shaped object
  names with a `/sanitize/i` property name — the intended, documented case;
- **any bare call `sanitize(x)`, `sanitizehtml(x)`, or `sanitizeHtml(x)`,
  regardless of where that function actually came from** — a same-file
  no-op function named `sanitize` qualifies;
- **any member call `<anything>.sanitize(x)`, regardless of the object's
  name** — because the second `if` inside the `MemberExpression` branch
  (`SANITIZER_CALLEE_NAMES.has(propName)`) checks the property name alone
  and does not require the object-name pattern to also match. `someObject.sanitize(x)`
  where `someObject` has nothing to do with DOMPurify satisfies this.

Both of the last two are real, exploitable-by-naming gaps: a call shaped like
`x.sanitize(...)` or a bare `sanitize(...)` is trusted by name alone, with no
verification that it is DOMPurify, any real sanitizer, or does anything at
all. This is the concrete, pre-existing "false confidence" risk this
experiment's research question is actually about narrowing.

## 5. How direct local variables are resolved

`resolveSingleAssignment` (`ast-utils.ts`) — shared by `xss.ts` and `sqli.ts`.
Given an `Identifier`, it resolves through Babel's own scope binding
(`path.scope.getBinding`) only when: the binding exists in the current file,
it is never reassigned after declaration (`binding.constant`), and the
declarator is a `const`/`let`/`var` with an initializer. It is **exactly one
hop** — `const a = "<b>x</b>"; const b = a; el.innerHTML = b;` is not resolved
because `b` traces to identifier `a`, not to a literal — and never crosses a
function boundary. A function parameter is never resolvable at all (correctly
always treated as dynamic).

## 6. Current benchmark/test coverage for DOM XSS

- `tests/fixtures/vulnerable/xss-*.ts` (14 files) and `tests/fixtures/safe/xss-*.ts`
  (11 files) plus `tests/fixtures/edge-cases/xss-*.ts` (4 files) — the
  regression corpus written alongside the rule itself. Includes
  `tests/fixtures/safe/xss-sanitized-dompurify.ts` and
  `tests/fixtures/edge-cases/xss-sanitizer-via-one-hop-variable.ts`, both of
  which exercise the intended `DOMPurify.sanitize(...)` shape — but none of
  the regression corpus tests the two over-broad name-only paths described
  in §4 (`sanitize(x)` as a fake local function, or `x.sanitize(x)` on an
  unrelated object). That gap is exactly what this experiment's frozen
  corpus adds.
- `tests/independent-benchmark/samples/blog-comment-widget.jsx`,
  `search-page.jsx`, and `legacy-widget.js` each include one genuine
  `DOMPurify.sanitize(...)`-at-the-sink case, scored in
  `tests/independent-benchmark/manifest.json` as an expected `low` finding.
  No case in that held-out corpus exercises sanitizer-name misuse either.
- No dedicated unit test file (`tests/unit/*.test.ts`) targets `xss.ts` or
  `isSanitizerWrapped` directly; XSS fixtures are exercised through
  `tests/unit/analyze.test.ts`'s fixture-directory sweep (vulnerable fixtures
  must produce a finding, safe fixtures must not).

## 7. Current limitations relevant to sanitization (already disclosed)

Direct quotes, `xss.ts`'s own doc comment and `README.md`:

- "Sanitizer recognition is name-based, not semantic, even through the
  variable trace." (`xss.ts`, line 82-83)
- The `makeFinding` limitations string for every HTML sink: "A sanitizer name
  match does not verify safe configuration."
- `README.md`'s supported-checks table: "values wrapped in a recognized
  sanitizer call, directly or one hop back (severity downgraded, not
  silently cleared)."

None of the existing disclosures mention the specific over-broad matches in
§4 (bare `sanitize()` of any origin, or `.sanitize()` on any receiver) by
name — they disclose "name-based, not semantic" as a general limitation but
not this particular, concrete failure mode. That gap in the disclosure itself
is part of what this experiment is checking.

No production logic was changed to produce this document.
