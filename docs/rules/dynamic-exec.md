# Dangerous dynamic execution — `dynamic-exec.ts`

Source: [`src/lib/analysis/rules/dynamic-exec.ts`](../../src/lib/analysis/rules/dynamic-exec.ts) · Tests: [`tests/rules/dynamic-exec.test.ts`](../../tests/rules/dynamic-exec.test.ts) · Category: `dynamic-exec`

All findings in this rule are **High** severity by default, never Critical — it can never establish that the argument is attacker-controlled, only that a dynamic-execution API was used. A fixed string literal is still flagged (these APIs are error-prone and hard to audit even with constant input), but the message says so plainly rather than implying an exploit exists.

---

## exec-eval

**What it flags:** Any call to `eval(...)`.

**Severity:** High.

**Risky example:** `function run(expr) { return eval(expr); }`

**Also flagged (deliberately):** `eval("1 + 1")` — a fixed literal still gets flagged, described accurately as "no attacker-controlled input visible here... still flagged because eval() is inherently hard to audit and easy to make unsafe with a future edit."

**Limitations:** Direct AST match only — flags the call shape, not exploitability.

**Tests:** `tests/fixtures/vulnerable/exec-eval-dynamic.ts`, `exec-eval-literal.ts` · `tests/independent-benchmark/samples/websocket-client.js`

---

## exec-function-ctor

**What it flags:** `new Function(...)` or `Function(...)` (called without `new` — identical risk).

**Severity:** High.

**Risky example:**
```js
function build(body) {
  const fn = new Function('x', body);   // or: Function('x', body)
  return fn(5);
}
```

**Tests:** `tests/fixtures/vulnerable/exec-new-function.ts`, `exec-function-call-form.ts`

---

## exec-set-timeout-string

**What it flags:** `setTimeout(...)` called with a string (or string-concatenation) first argument instead of a function reference.

**Severity:** High.

**Risky example:** `function schedule(userCode) { setTimeout("doSomething(" + userCode + ")", 1000); }`

**Safe example:** `function schedule(cb) { setTimeout(() => { cb(); }, 1000); }` — a function reference, the normal case, NOT flagged.

**Tests:** `tests/fixtures/vulnerable/exec-set-timeout-string.ts` · `tests/fixtures/safe/exec-set-timeout-function-ref.ts`

---

## exec-set-interval-string

**What it flags:** Same as `exec-set-timeout-string`, for `setInterval(...)`.

**Severity:** High.

**Risky example:** `function poll(expr) { setInterval(\`checkStatus(${expr})\`, 5000); }`

**Tests:** `tests/fixtures/vulnerable/exec-set-interval-string.ts`

---

## Reverted: non-literal `import()`/`require()` specifier (not a shipped rule)

A check for `import(computedSpecifier)`/`require(computedSpecifier)` was built, passed its own fixtures, and was **reverted the same day** after live testing showed it fires on the standard route/locale code-splitting idiom (`import(\`./locales/${locale}.json\`)`) — a completely ordinary, ubiquitous pattern in React/Vite/webpack apps, structurally indistinguishable via AST shape alone from an actually dangerous computed specifier. Documented here, not hidden, because the two false-positive cases are now permanent regression fixtures: `tests/fixtures/safe/exec-dynamic-import-nonliteral-not-flagged.ts`, `exec-require-nonliteral-not-flagged.ts`. Full account in [`docs/model-improvements.md`](../model-improvements.md).
