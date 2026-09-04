# Architecture

```
User pasted/uploaded text
  → file-size and file-type validation      (src/lib/analysis/analyze.ts — 500KB hard cap, rejected outright)
  → Web Worker                              (src/lib/analysis/worker.ts + client.ts)
  → parser selected by mode                 (html attribute scan  OR  @babel/parser AST)
  → AST traversal / narrowly scoped rules   (src/lib/analysis/rules/*.ts)
  → normalized Finding objects              (src/lib/analysis/types.ts)
  → deduplication                           (src/lib/analysis/dedupe.ts)
  → result UI                               (src/components/ReportView.jsx)
  → optional local-only report persistence  (src/lib/storage.ts — off by default)
```

## Parser choice: `@babel/parser` + `@babel/traverse`

Three realistic options were available for browser-side JS/TS/JSX parsing:

- **`@typescript-eslint/typescript-estree`** — the most "correct" TS parser (it's what `typescript-eslint` itself uses), but it pulls in the full TypeScript compiler as a dependency, which is large and is primarily designed for a Node/CLI environment, not a browser worker bundle.
- **`acorn` + `acorn-jsx` + a separate TS layer** — small and fast for plain JS/JSX, but TypeScript support requires bolting on a separate, less mature plugin, and keeping JS/JSX/TS parsing consistent across three different plugins adds real maintenance risk for rules that need to traverse all three uniformly.
- **`@babel/parser` + `@babel/traverse`** (chosen) — a single parser that accepts the union of JS/TS/JSX/TSX syntax when both the `jsx` and `typescript` plugins are enabled together, with a mature, well-documented visitor API (`@babel/traverse`) that every rule module uses identically regardless of what syntax was actually present. It does **not** include a type checker — this is a deliberate scope limit (see README "Known limitations"), not an oversight forced by the parser choice.

This choice is also what makes the old HTML/React/JavaScript/Auto "mode" selector honest again: for anything that isn't HTML, exactly one parser and one rule set runs, because Babel's parser already accepts the syntactic union of all four. The UI's mode selector is now just "HTML vs. everything else," which is the one distinction that actually changes which code path runs.

## Web Worker isolation

`src/lib/analysis/client.ts` spawns a single worker (`new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })`) and communicates over `postMessage`. Every request carries an incrementing `requestId`; the client discards any response whose `requestId` doesn't match the most recently issued one. This is **best-effort cancellation by discarding stale results**, not true mid-parse interruption — the worker still finishes whatever it started, since Babel's parser/traverse calls are synchronous and don't yield. Given the 500KB input cap, worst-case analysis time is small enough (low hundreds of ms even for pathological input, verified informally, not exhaustively fuzzed) that this tradeoff was accepted rather than building a more complex chunked/interruptible parser. This is a known, disclosed limitation, not a claim of true preemptive cancellation.

The worker also carries a **build-tooling fix worth documenting**: `@babel/parser`/`@babel/traverse` read `process.env.NODE_ENV` at their own module top level. There is no `process` global inside a Web Worker. `src/lib/analysis/process-shim.ts` is a dependency-free module, imported first (before `analyze.ts`) in `worker.ts`, that defines a minimal `globalThis.process = { env: { NODE_ENV: "production" } }` if one doesn't already exist. ES module evaluation order guarantees a module with no imports of its own (like the shim) finishes evaluating before any module that imports it, which is what makes "imported first" actually mean "runs first" here. This was found and fixed by manually invoking the worker in a live browser during this rewrite — the app hung on "Processing..." indefinitely before the fix, with `Uncaught ReferenceError: process is not defined` in the worker's own console.

## Rule design

Every rule module in `src/lib/analysis/rules/` exports a `Rule` object (`id`, `category`, `title`, and a `run(ctx)` function taking the parsed AST + source text). Rules are pure functions with no shared mutable state, run independently, and a thrown exception in one rule is caught and recorded in `AnalysisResult.rulesRun[].error` rather than crashing the whole analysis or being silently swallowed.

Every `Finding` a rule produces must include `whyItMatters`, `saferExample`, and `limitations` — there is no code path that constructs a `Finding` without stating what it can't see. This is enforced by the TypeScript `Finding` interface in `types.ts`, not just convention.

## HTML checks are intentionally not part of this AST engine

`rules/html.ts` is plain attribute/text scanning over the raw markup string, not an AST module — there is no HTML parser in this project. It is documented as such in its own file header, capped at "medium" severity, and its inline-event-handler check requires a literal quote character (`onclick="`) so it structurally cannot match a JSX `onClick={...}` prop even if it were ever run against JSX source (it never is — the orchestrator only calls it in HTML mode).
