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

## New sinks: iframe.srcdoc, dynamic import()/require() (2026-09-03)

**The problem, in simple terms:** the checker only ever flags what it's specifically been told to look for. Two real, well-known risk shapes weren't on the list at all — not "checked and found safe," just never checked:

- **`iframe.srcdoc = someValue`.** This sets an iframe's entire embedded document — same category of risk as `innerHTML`, arguably worse, since the browser renders it as a complete HTML page, scripts included, with no sink-side escaping at all. The checker treated it as an ordinary, uninteresting property assignment.
- **`import(someValue)` / `require(someValue)` where `someValue` isn't a fixed string.** Normally the module being loaded is written right there in the source (`import('./chart.js')`) — completely safe, and extremely common, so it's still never flagged. But when the specifier is a variable, a concatenation, or a template — the module that actually loads is decided at runtime — that's a different risk class (loading and running code the developer didn't put there on purpose; the standard name for this is CWE-829).

**The fix:** both are additive, narrow rule extensions, not a redesign:

- `xss.ts`'s existing `innerHTML`/`outerHTML` sink logic — including the one-hop variable trace and sanitizer detection already built for those — now also covers `.srcdoc`. No new mechanism, just one more property name recognized as "this renders as HTML."
- `dynamic-exec.ts` gained two new, separate checks: flag `import(...)` or `require(...)` only when the first argument is **not** a plain string literal (or a template literal with no `${...}`). A literal specifier of any kind is never touched — that's the normal case and stays silent.

**How this was verified:** 6 new fixtures were added to the shared corpus (`scripts/generate-fixtures.mjs`) — 2 vulnerable + 1 safe for `srcdoc`, 2 vulnerable + 2 safe for import()/require() — and the existing corpus-driven test suites (`tests/rules/xss.test.ts`, `tests/rules/dynamic-exec.test.ts`) picked them up automatically with no test-file changes needed, since those suites just iterate whatever's in the corpus for their rule group.

**Full suite after this change:** 104/104 tests passing (was 98).

**What this does *not* do:** the `import()`/`require()` check is a call-shape flag only — it cannot tell a genuinely dangerous case (`require(userSuppliedPath)`) apart from a legitimate one (`require(configuredLocale)`, a small internal plugin registry). Both are flagged identically as "high," with the message saying plainly that this isn't a confirmed exploit. This is the same honesty trade-off the rest of the engine already makes: flag the shape, disclose that the shape alone isn't proof.

**Update, same day — this check was reverted after about ten minutes of real use.** Read the section below before trusting the paragraph above; it explains why.

## Reverted: dynamic import()/require() check (2026-09-03, same day)

**What happened:** immediately after shipping the check above, real testing (not the corpus I wrote myself — actually pasting realistic code) found it firing "high" on this:

```js
async function loadLocale(locale) {
  const messages = await import(`./locales/${locale}.json`);
  return messages.default;
}
```

and this:

```js
function loadStrategy(name) {
  return require('./strategies/' + name);
}
```

Both are completely ordinary, extremely common patterns — code-splitting by locale/route is the standard idiom in React/Vite/webpack apps, and "load a plugin/adapter by computed name" is a normal design pattern in Node backends. Neither is a security problem by itself. The check couldn't tell them apart from an actually dangerous computed specifier, because **there is no AST-level difference** — both are "a template or concatenation instead of a literal string." Compare that to `db.query(concatenatedSql)` or `el.innerHTML = concatenatedHtml`: there, a `+`/`${}` at that specific sink really is a strong signal, because those APIs execute their argument as SQL/HTML directly. `import()`/`require()` just resolves a module path — "a computed module path" is itself unremarkable software engineering, not a risk signal.

**Why this matters, in simple terms:** a real check needs to be right often enough that a "high" finding still means something. This one would have fired on a large fraction of ordinary modern JS/React codebases — exactly the kind of noise this project was rewritten to get away from (see `docs/baseline-audit.md` for what the *old* tool's noise looked like). Shipping it anyway just to have "more coverage" would have repeated the old project's core mistake with new code.

**The fix:** removed the check entirely from `dynamic-exec.ts` rather than trying to tune it (no naming heuristic like "does the identifier look user-supplied" would be reliable, and this codebase doesn't use that style of heuristic anywhere else). The two false-positive cases above are now locked in as permanent **safe** fixtures (`exec-dynamic-import-nonliteral-not-flagged`, `exec-require-nonliteral-not-flagged`) so this exact mistake can't silently come back.

**The bigger lesson (worth being explicit about):** the check passed 100% of its own tests when it shipped, because I wrote the corpus fixtures alongside the rule — of course they agreed with each other. The very first snippet that wasn't written by me broke it. This is exactly the same warning `docs/benchmark-report.md` already carries about the 1.00/1.00 precision/recall numbers: a self-authored corpus proves internal consistency, not real-world accuracy. This is a live example of that disclaimer being true, not just a caveat nobody hits in practice.

**Full suite after this revert:** 104/104 tests passing (2 fixtures repurposed from "this must be caught" to "this must stay silent," net fixture count unchanged from the previous entry).

## More ORM raw-query coverage for SQLi (2026-09-03)

**What changed:** `sqli.ts`'s qualified-receiver list for `.query()` gained three names — `sequelize`, `dataSource`, `queryRunner` — and its always-flagged method-name list gained Prisma's two explicitly-named unsafe raw-query escape hatches, `$queryRawUnsafe` and `$executeRawUnsafe`.

**Why these specific names, and not more:** each addition was checked against the same question that just burned the `import()`/`require()` check: *is this name specific enough that adding it can't plausibly misfire on unrelated code?* `sequelize`/`dataSource`/`queryRunner` are unambiguous ORM-instance names. `$queryRawUnsafe`/`$executeRawUnsafe` are even safer to add unconditionally (regardless of receiver name) — nothing but Prisma's raw-SQL escape hatch is plausibly named that. By contrast, bare `manager` — TypeORM's `EntityManager` is often just called "manager" — was considered and deliberately **left out**: cache managers, state managers, and task managers commonly expose their own unrelated `.query`-shaped methods, so this would reintroduce exactly the kind of generic-name noise risk this rule already avoids for `db`/`client`/etc. That's now a documented, accepted false negative (`sqli-typeorm-manager-not-qualified` in the test corpus), not a silent gap.

**A safety note on Prisma specifically:** Prisma's *other* raw-query API, `$queryRaw`/`$executeRaw` used as a tagged template — `` prisma.$queryRaw`SELECT ... WHERE id = ${id}` `` — auto-parameterizes every `${}` and is safe by Prisma's own design. It was never at risk of being flagged (it's a different AST node type, a TaggedTemplateExpression, that this rule's CallExpression-only visitor never even looks at), but a dedicated safe fixture now locks that in explicitly rather than leaving it to accident.

**Full suite after this change:** verified via `tests/independent-benchmark/samples/report-export.js` (a realistic Sequelize module, written independently of these unit-test fixtures) in addition to the new unit-test fixtures — see `docs/independent-benchmark-report.md`.

## Conservative entropy-based secrets fallback (2026-09-03)

**The problem, in simple terms:** the secrets checker could only ever catch a leak two ways — a known vendor's key format, or a value assigned to a variable/property whose *name* obviously says "credential" (`API_KEY`, `SECRET`, `TOKEN`...). A real secret that's neither a known vendor format nor sitting in a suggestively-named variable — e.g. a custom internal token passed straight into a header argument with no name at all — was completely invisible.

**Why this one is riskier than the others, and what that meant for how it was built:** a "does this look random?" check has no vendor format and no name to anchor it — it's a pure guess based on the shape of the string itself. Naive versions of this idea (as shipped by real tools historically) are notorious for misfiring on git commit hashes, UUIDs, base64 image data, CDN URLs, and plain identifiers. So before writing a single line of the rule, I computed actual Shannon entropy (a standard measure of "how random do this string's characters look") for a batch of realistic strings on both sides — real-token-shaped values vs. every non-secret shape I could think of — and only picked thresholds once every non-secret sample cleared them safely. The numbers (bits of entropy per character):

| Sample | Entropy | Flagged? |
|---|---|---|
| A real-looking random token | 5.12 | Yes |
| A GitHub-style token, no vendor match by construction | 5.0+ | Yes |
| SHA-1/SHA-256 git commit hash (40/64-char hex) | 3.7–3.8 | No (hex is capped low, plus an explicit canonical-hash-length exclusion) |
| UUID | 3.4 | No (explicit UUID exclusion) |
| npm/yarn SRI "integrity" hash (`sha512-...`) | 5.75 | No (explicit `sha512-`/`sha1-`/etc. prefix exclusion — this one genuinely would have misfired without it; found during calibration, not after shipping) |
| CDN URL with a hashed filename | 4.58 | No (excluded by URL shape, not by entropy — its entropy alone is too close to a real token's to separate safely) |
| Base64 image/font data | 2.9–4.15 | No (under the bar) |
| SNAKE_CASE constant name / i18n dotted key / camelCase identifier | 3.9–4.4 | No (under the bar) |

The rule requires **all** of: length ≥ 24, no whitespace, not URL/path-shaped, not an SRI integrity hash, not a UUID, not a canonical-length pure-hex hash, contains both a letter and a digit, and entropy ≥ 4.5 bits/char. Every one of those is a real, separately-justified filter, not a single number picked and hoped for.

**Severity:** always `low`, never higher — this is explicitly the least confident check in the rule group, and the message says so.

**How this was verified beyond the calibration table:** 8 new fixtures (2 vulnerable, 6 adversarial-safe) were added to the unit-test corpus, *and* the independent benchmark corpus (`tests/independent-benchmark/`, see below) includes two more realistic files built the same way — `session-cache.js` (should be caught) and `build-info.js` (should stay silent, mixing a git SHA, a URL, and an SRI hash in one realistic file). Both matched their predicted ground truth on the first run.

**What this does *not* do:** it will still miss a real secret that's hex-only or otherwise lands under the entropy bar (an accepted trade-off — lowering the bar to catch those would also catch git hashes and identifiers, which is worse). It has no way to exclude every possible non-secret high-entropy shape that exists; the ones listed above are the ones actually checked, not a claim of completeness.

## Fixed: dangerouslySetInnerHTML as a variable was invisible entirely (2026-09-03)

**Found how:** while building the independent benchmark below, not reported by a user and not something I was looking for. A realistic admin-panel file used the extremely common React pattern of building the props object separately — `const props = { __html: x }; <div dangerouslySetInnerHTML={props} />` — instead of inlining it. The rule's own code only ever checked `if (!t.isObjectExpression(expr)) return;` directly on the JSX attribute's expression, with no attempt to resolve a variable first. An Identifier is never an ObjectExpression by syntax alone, so this whole pattern — safe or not — silently produced no finding, ever, regardless of what was inside.

**The fix:** reused the same one-hop resolution (`resolveSingleAssignment`) already built for every other sink in this file — no new mechanism. If the JSX expression is a bare identifier, resolve it back one hop; if that resolves to an object literal, use that instead.

**Why this one mattered more than the usual one-hop gap:** the other one-hop limitations in this file cap out at "a second variable hop isn't traced" — a narrowing case. This one was total blindness for a mainstream React idiom, independent of how many hops were involved. It's now subject to the same one-hop limit as everything else (a *second* level of indirection — `const wrapper = props;` — still isn't traced, and the admin-panel benchmark file demonstrates exactly that, deliberately, as a disclosed remaining gap).

## Independent benchmark corpus (2026-09-03)

**The problem this addresses head-on:** `docs/benchmark-report.md` has carried an honest disclaimer since it was first written — its 1.00/1.00 precision/recall is measured against `tests/fixtures/`, a corpus written *alongside* the rules, one tidy file per specific pattern, iterated on until the rule's own tests passed. That number proves internal consistency, not real-world accuracy, and the report says so. It was still the only accuracy measurement this project had.

**What was built:** a second, separate corpus at `tests/independent-benchmark/` — 14 larger, realistic, multi-concern files (a small Express router, a React dashboard widget with real data-fetching, a Node backup CLI script, a config module with a leftover hardcoded key, a WebSocket client with a real historical `eval()` anti-pattern) instead of one-issue-per-file snippets. Ground truth for every file was written into `manifest.json` by manual security review **before** the scoring script (`scripts/run-independent-benchmark.ts`, `npm run bench:independent`) was ever run against the live engine — the script itself only scores and reports; it has no code path that lets ground truth be adjusted after the fact to match what the engine produced.

**What this is honestly still not:** a third-party or externally-sourced benchmark. The same process that writes the rules wrote this corpus. What's genuinely different is that these files weren't written to test a specific rule's logic — they're realistic application code with mixed safe/unsafe patterns in the same file, larger noise-floor checks on "nothing wrong here" code, and predictions made while deliberately not looking at what the engine would do. See the report's own opening disclaimer for the full framing — it's written to stand next to the fixtures-based report's disclaimer, not to overclaim past it.

**What happened the first time it ran:** while writing the realistic admin-panel file (predicting ground truth, not yet having run anything), I found the dangerouslySetInnerHTML-as-a-variable gap described above and fixed it before the first scoring run — a real bug the exercise of writing *realistic* code surfaced, the same way the earlier `import()`/`require()` mistake was caught by real usage rather than by the tidy fixtures. After that fix, the first (and so far only) scoring run matched every prediction: 14 files, 13 true positives, 0 false positives, 0 false negatives. See `docs/independent-benchmark-report.md` for the full breakdown, including the one known/accepted false positive (`admin-panel.jsx`'s two-hop case) that was predicted to be flagged and was.

## Fixed: decorator-based TypeScript failed to parse at all (2026-09-03)

**Found how:** not a user report, not a rule test — a direct probe of the parser against realistic modern TypeScript syntax (decorators, enums, private class fields, `satisfies`, abstract classes, namespaces, JSX fragments), done specifically to check for parser-level reliability gaps rather than detection-quality gaps.

**What was broken:** any file with a class, method, or parameter decorator —

```ts
@Injectable()
export class UserController {
  @Get(':id')
  async findOne(@Param('id') id: string) { ... }
}
```

— failed to parse **at all**. Not a missed finding: a hard parse error, `result.status !== "ok"`, zero rule coverage for the entire file, no matter what was inside it. This is the style essentially every NestJS, Angular, TypeORM-entity, and class-validator-DTO file is written in — a large, common share of real backend TypeScript that this checker could not analyze at all before this fix, silently (it would just report a parse error, easy to mistake for "my code has a syntax problem" rather than "this tool can't read decorators yet").

**The fix:** added the `decorators-legacy` Babel parser plugin. This needed one real decision, not just "turn on decorator support": Babel offers two, incompatible decorator syntaxes — `decorators-legacy` (matches TypeScript's `experimentalDecorators`, the original proposal) and `decorators` (the newer TC39 stage-3 proposal, the TypeScript 5.0+ default *without* `experimentalDecorators`). Checked empirically before picking: the TC39 `decorators` plugin **cannot parse parameter decorators at all** (`@Param('id') id` — a NestJS controller's single most common decorator shape) because that proposal removed them. `decorators-legacy` handles it correctly, and matches what NestJS/Angular/TypeORM/class-validator all actually target today. Picking the newer-sounding option would have fixed the class-decorator case shown in bug reports and immediately failed on the parameter-decorator case that's in almost every real controller.

**What was checked and left alone:** old-style TypeScript angle-bracket casts (`<Foo>value`) still don't parse — this is a real, permanent limitation, not an oversight. That syntax is inherently ambiguous with JSX once JSX parsing is on (which it always is here, since this tool doesn't know a file's real extension), which is exactly why TypeScript itself rejects that syntax in `.tsx` files and recommends `value as Foo`. Enums, private class fields (`#foo`), `satisfies`, abstract classes, namespaces, and JSX fragments were all already parsing correctly — checked directly, not assumed, before writing this entry.

**How this was verified:** 3 new regression tests (`tests/regression/decorator-syntax-parses.test.ts`) confirming both that decorated code parses AND that a real vulnerability inside a decorated method is still caught (parsing successfully isn't enough on its own — the rules need to actually run against the resulting AST, which they do). A new realistic file in the independent benchmark (`reports-controller.ts`, a full NestJS controller+service pair) matched its predicted ground truth on the first run alongside the rest of that corpus.

**Full suite after this change:** 119/119 unit tests passing (was 116); independent benchmark: 15 files, 14 TP, 0 FP, 0 FN.
