# Model improvements log

Plain-language record of changes to the detection engine itself (not the UI). Each entry: what was true before, what changed, why, and how it was verified.

## Same-scope variable tracing (2026-09-02)

**The problem, in simple terms:** the checker could only ever look at the exact spot where something risky happens. If a risky value was built one line earlier and stored in a variable, the checker had no memory of that — it only judged whatever was written directly at the risky spot.

That cut both ways:

- **It missed real risk.** `const query = "SELECT ... WHERE id = " + id; db.query(query);` was invisible, because at the call site all the checker could see was the name `query`, not what was inside it.
- **It falsely flagged safe code.** `const safe = "<b>hi</b>"; el.innerHTML = safe;` was flagged as risky, because at the sink all the checker could see was the name `safe`, and a bare name is never "obviously a literal" by itself — even though `safe` really was just a fixed piece of text.

**The fix:** when the checker hits a spot like this and sees a plain variable name instead of an actual value, it now takes **one step back** — it looks up where that variable was declared (using Babel's own, real scope-resolution machinery, not a guess) — but only when that's unambiguous: the variable must be declared with `const`/`let`/`var` *and an initial value*, and it must never be reassigned afterward. If either of those isn't true (a function parameter, a variable that gets reassigned later, a variable declared with no initial value), the checker falls back to its old, already-conservative behavior for "I don't actually know what this is."

This is deliberately **one step, not a full trace.** `const a = "..."; const b = a; sink(b)` is still not resolved — `b` traces to `a`, an identifier, not directly to the literal. That's a real, disclosed limitation, not hidden: see the "known limitation" test cases below.

**What changed concretely:**

| Rule | Before | After |
|---|---|---|
| XSS (`innerHTML`, `dangerouslySetInnerHTML`, etc.) | `const safe = "<b>x</b>"; el.innerHTML = safe;` → **falsely flagged** | Correctly recognized as safe |
| XSS | `const clean = DOMPurify.sanitize(x); el.innerHTML = clean;` → sanitizer invisible, flagged as high | Sanitizer now recognized through the variable, downgraded to low |
| SQL injection | `const q = "..." + id; db.query(q);` → **missed entirely** | Now correctly flagged |

**How this was verified, not just claimed:** before writing the fix, I ran the exact "safe literal via variable" snippet through the live engine and confirmed empirically that it *was* being falsely flagged (the code comment describing this as a "false negative" was itself wrong — worth noting as its own small lesson: a comment asserting a limitation is a claim too, and needs the same checking as the code). After the fix, both directions were re-verified the same way, plus locked in as permanent automated tests so this can't silently regress:

- `tests/regression/safe-innerhtml-literal.test.ts` — the fixed false positive, the fixed sanitizer case, and the still-remaining two-hop limitation.
- `tests/regression/parameterized-query.test.ts` — the fixed SQL-injection false negative, and its still-remaining two-hop limitation.
- 4 new fixtures in `tests/fixtures/` covering both directions.

**Full suite after this change:** 98/98 tests passing (was 90).

**What this does *not* do:** this is still not real data-flow or taint analysis. It doesn't cross function boundaries, doesn't merge multiple possible values, doesn't handle destructuring, and stops at exactly one variable hop. Those remain honestly disclosed limitations in each rule's own file, not silently fixed and not silently ignored.
