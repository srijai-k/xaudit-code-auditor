# DOM XSS / unsafe HTML injection — `xss.ts`

Source: [`src/lib/analysis/rules/xss.ts`](../../src/lib/analysis/rules/xss.ts) · Tests: [`tests/rules/xss.test.ts`](../../tests/rules/xss.test.ts), [`tests/regression/safe-innerhtml-literal.test.ts`](../../tests/regression/safe-innerhtml-literal.test.ts) · Category: `xss`

AST-based (Babel), with one same-scope variable hop (`resolveSingleAssignment` in [`ast-utils.ts`](../../src/lib/analysis/ast-utils.ts)) — not full data-flow/taint analysis. A finding is only raised when the value at a sink isn't provably a static string, checked either directly or by tracing an identifier back one hop to a `const`/`let` declaration that's never reassigned.

Every `ruleId` below has its own anchor on this page — this is what `helpUri` in the SARIF export points to.

---

## xss-inner-html

**What it flags:** A non-literal value assigned to `.innerHTML`.

**Severity:** High. Downgraded to **Low** (never suppressed) when the value is wrapped in a recognized sanitizer call (`DOMPurify.sanitize(...)`, `sanitizeHtml(...)`, `xss(...)`), directly or one variable hop back — a name match, not a verification that the sanitizer is configured safely.

**Risky example:**
```js
function render(userInput) {
  const el = document.getElementById('out');
  el.innerHTML = userInput;
  return el;
}
```

**Safe example:**
```js
function render() {
  const safe = "<b>hi</b>";       // a literal, traced back one hop
  const el = document.getElementById('x');
  el.innerHTML = safe;             // NOT flagged
  return el;
}
```

**Limitations:** The one-hop trace never crosses a function boundary or a second variable (`const a = "..."; const b = a; el.innerHTML = b;` is still flagged — a known, disclosed false positive, see `tests/fixtures/edge-cases/xss-literal-via-two-hop-variable-still-flagged.ts`). A sanitizer name match does not verify safe configuration.

**Tests:** `tests/fixtures/vulnerable/xss-inner-html-user-input.ts`, `xss-template-literal-inner-html.ts` · `tests/fixtures/safe/xss-static-literal-inner-html.ts`, `xss-literal-via-one-hop-variable.ts`, `xss-sanitized-dompurify.ts` (sanitizer downgrade)

---

## xss-outer-html

**What it flags:** Same as `xss-inner-html`, for `.outerHTML`.

**Severity:** High / Low (sanitizer downgrade) — identical rules to `xss-inner-html`.

**Risky example:**
```js
const sink = document.getElementById('x');
function setter(v) { sink.outerHTML = v; }
setter(location.hash.slice(1));
```

**Limitations:** Same as `xss-inner-html`.

**Tests:** `tests/fixtures/vulnerable/xss-outer-html-alias.ts`

---

## xss-iframe-srcdoc

**What it flags:** A non-literal value assigned to an iframe's `.srcdoc` — same risk class as `innerHTML`, arguably worse: the browser renders it as a *complete HTML document*, scripts included, with no sink-side escaping at all.

**Severity:** High / Low (sanitizer downgrade), same mechanism as `xss-inner-html`.

**Risky example:**
```js
function preview(frame, userHtml) {
  frame.srcdoc = userHtml;
  return frame;
}
```

**Safe example:**
```js
function preview(frame) {
  frame.srcdoc = '<p>Loading…</p>';  // static literal — NOT flagged
  return frame;
}
```

**Limitations:** Same one-hop-only tracing as `xss-inner-html`.

**Tests:** `tests/fixtures/vulnerable/xss-iframe-srcdoc-dynamic.ts` · `tests/fixtures/safe/xss-iframe-srcdoc-static-literal.ts`

---

## xss-insert-adjacent-html

**What it flags:** A non-literal second argument to `el.insertAdjacentHTML(position, html)`.

**Severity:** High / Low (sanitizer downgrade).

**Risky example:**
```js
function append(el, userBio) {
  el.insertAdjacentHTML('beforeend', userBio);
  return el;
}
```

**Limitations:** Same one-hop tracing limits as `xss-inner-html`.

**Tests:** `tests/fixtures/vulnerable/xss-insert-adjacent-html.ts`

---

## xss-document-write

**What it flags:** A non-literal argument to `document.write(...)`.

**Severity:** High / Low (sanitizer downgrade).

**Risky example:**
```js
function trackPixel(id) {
  document.write(`<img src="/pixel?id=${id}">`);
}
```

**Tests:** `tests/fixtures/vulnerable/xss-document-write.ts`

---

## xss-document-writeln

**What it flags:** Same as `xss-document-write`, for `document.writeln(...)`.

**Severity:** High / Low (sanitizer downgrade).

**Risky example:**
```js
function legacyWrite(name) {
  document.writeln("<h1>Hello " + name + "</h1>");
}
```

**Tests:** `tests/fixtures/vulnerable/xss-document-writeln.ts`

---

## xss-dangerously-set-inner-html

**What it flags:** React `dangerouslySetInnerHTML={{ __html: expr }}` where `expr` isn't a static string — including when the *whole* `{ __html: expr }` object is itself one variable hop away (`const props = { __html: expr }; <div dangerouslySetInnerHTML={props} />`). That variable-object case was a real, previously-invisible gap (found via the independent benchmark, not a fixture) — before the fix, only an inline object literal was ever recognized at all.

**Severity:** High / Low (sanitizer downgrade).

**Risky example:**
```jsx
export default function Comment({ body }) {
  return <div dangerouslySetInnerHTML={{ __html: body }} />;
}
```

**Safe example:**
```jsx
import DOMPurify from 'dompurify';
export default function Post({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;  // downgraded to Low
}
```

**Limitations:** One hop for the *object* (variable holding `{ __html }`) and one hop for the *value* inside it are each resolved independently — but not compounded across both plus a further chain. Never inspects JSX event props (`onClick`, `onChange`, etc.) at all — there's no shared selector between "HTML sink" and "on* prop" in this module.

**Tests:** `tests/fixtures/vulnerable/xss-dangerously-set-inner-html.ts` · `tests/fixtures/safe/react-dangerously-set-sanitized.ts` (downgrade) · `tests/independent-benchmark/samples/admin-panel.jsx` (the variable-object case)

---

## xss-jquery-html

**What it flags:** jQuery/AngularJS-jqLite `.html(expr)` where `expr` isn't a static string — but only when the receiver is recognizably jQuery/jqLite-sourced. A bare `.html()` method name isn't a strong enough signal alone (mirroring the same discipline `sqli.ts` uses for `.query()`).

**Three recognized signals for "jQuery-sourced," in order of confidence:**
1. A direct `$(...)`/`jQuery(...)`-rooted chain: `$('#el').html(x)`, `$('#el').find('.y').html(x)`.
2. A variable one hop back assigned from one of those: `const $el = $(...); $el.html(x)`.
3. A `$`-prefixed identifier or property access (`$el`, `$container`, `this.$container`) — a naming-convention fallback for the common function-parameter and Backbone.View `this.$el` cases neither structural check catches.

**Severity:** High / Low (sanitizer downgrade).

**Risky examples:**
```js
$('#profile-bio').html(userBio);                          // direct chain
const $bio = $('#profile-bio'); $bio.html(userBio);        // cached variable
function link(scope, $element) { $element.html(scope.x); } // $-prefixed param
this.$container.find('.bio').html(bio);                     // this.$-property chain
```

**Safe example:**
```js
function render(userBio) {
  return report.html(userBio);   // 'report' is not jQuery-shaped by any signal — NOT flagged
}
```

**Limitations:** Deliberately does **not** cover `.append()`/`.prepend()`/`.after()`/`.before()`/`.replaceWith()` — those are routinely called with a safe DOM/jQuery element reference rather than a string, so "not a literal" is a much weaker signal there than for `.html()`. The `$`-prefix naming fallback is a convention, not a structural guarantee — a non-jQuery object that happens to be named that way and has its own unrelated `.html()` method could theoretically misfire.

**Tests:** `tests/fixtures/vulnerable/xss-jquery-html-direct-chain.ts`, `xss-jquery-html-cached-object-one-hop.ts`, `xss-jquery-html-dollar-prefixed-param.ts`, `xss-jquery-html-this-dollar-property-chain.ts` · `tests/fixtures/safe/xss-jquery-html-static-literal.ts`, `xss-jquery-html-sanitized.ts`, `xss-html-method-on-unrelated-object.ts` · `tests/independent-benchmark/samples/legacy-widget.js`

---

## xss-location-javascript-uri

**What it flags:** `location`/`location.href`/`window.location`/`window.location.href`/`document.location`(`.href`) assigned a value built by concatenating the **literal string `javascript:`** with a dynamic value.

**Why this is scoped this narrowly:** the obvious broader version — "flag any dynamic value reaching `location.href`" — was deliberately rejected. Dynamic redirects (`location.href = "/profile/" + userId`) are one of the most common, completely benign patterns in real code; a broad check here would repeat the exact mistake that got the `import()`/`require()` check reverted (see `dynamic-exec.md`). Requiring the literal scheme to physically appear in the source is a narrow, high-confidence signal instead — nobody writing a normal redirect types the characters `javascript:` into a URL-building expression.

**Severity:** High. No sanitizer-downgrade path exists for this one — there's no equivalent "safe encoding" for a URI scheme.

**Risky example:**
```js
function go(userInput) {
  location.href = "javascript:" + userInput;
}
```

**Safe example:**
```js
function goToProfile(userId) {
  location.href = "/profile/" + userId;   // no javascript: literal — NOT flagged
}
```

**Limitations:** A `javascript:` scheme held in a *variable* rather than written as a literal in the same expression (`el.setAttribute('href', callbackScheme + callbackTarget)`) is invisible to this check — see `tests/independent-benchmark/samples/redirect-handler.js`'s `buildCallbackLink` for a deliberate, disclosed example of this exact miss.

**Tests:** `tests/fixtures/vulnerable/xss-location-href-javascript-uri.ts`, `xss-window-location-javascript-uri-one-hop.ts` · `tests/fixtures/safe/xss-location-href-plain-redirect-not-flagged.ts`, `xss-location-href-external-url-not-flagged.ts` · `tests/independent-benchmark/samples/redirect-handler.js`

---

## xss-setattribute-javascript-uri

**What it flags:** `el.setAttribute('href'|'src', ...)` where the value is built the same `javascript:`-concatenation way as `xss-location-javascript-uri`.

**Severity:** High.

**Risky example:**
```js
function go(el, userInput) {
  el.setAttribute('href', 'javascript:' + userInput);
}
```

**Safe example:**
```js
function setLink(el, slug) {
  el.setAttribute('href', '/posts/' + slug);   // NOT flagged
}
```

**Limitations:** Same as `xss-location-javascript-uri` — a variable-held scheme is invisible.

**Tests:** `tests/fixtures/vulnerable/xss-setattribute-href-javascript-uri.ts` · `tests/fixtures/safe/xss-setattribute-href-normal-url-not-flagged.ts`

---

## xss-jsx-href-javascript-uri

**What it flags:** A JSX `href`/`src` prop built the same `javascript:`-concatenation way.

**Severity:** High.

**Risky example:**
```jsx
export default function Link({ payload }) {
  return <a href={`javascript:${payload}`}>Click</a>;
}
```

**Safe example:**
```jsx
export default function UserLink({ username }) {
  return <a href={`/users/${username}`}>{username}</a>;   // NOT flagged
}
```

**Limitations:** Same as `xss-location-javascript-uri`.

**Tests:** `tests/fixtures/vulnerable/xss-jsx-href-javascript-uri-template.ts` · `tests/fixtures/safe/xss-jsx-href-normal-not-flagged.ts`
