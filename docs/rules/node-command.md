# Node.js command patterns — `node-command.ts`

Source: [`src/lib/analysis/rules/node-command.ts`](../../src/lib/analysis/rules/node-command.ts) · Tests: [`tests/rules/node-command-injection.test.ts`](../../tests/rules/node-command-injection.test.ts) · Category: `node-command`

Labeled "Node.js patterns," deliberately not "full command-injection analysis." Name-based only: this rule parses JS/TS syntax, it does not resolve `require`/`import` bindings — `import { exec as run } from "child_process"` defeats the name match entirely (a disclosed false negative).

---

## node-command-exec-dynamic

**What it flags:** `exec(...)`/`execSync(...)` (by identifier or `object.exec`/`object.execSync` member call) where the argument is not a static string.

**Severity:** High.

**Risky example:**
```js
const { exec } = require('child_process');
function run(userInput) {
  exec("ls " + userInput);
}
```

**Limitations:** Name-based match only — an aliased import defeats it; does not verify the argument is actually attacker-controlled.

**Tests:** `tests/fixtures/vulnerable/node-exec-dynamic.ts`, `node-exec-sync-dynamic.ts` · `tests/independent-benchmark/samples/backup-script.js`

---

## node-command-spawn-shell

**What it flags:** `spawn(cmd, args, { shell: true })` where `cmd` or any element of `args` is not a static string, and the options object is a literal inline `{ shell: true }` (not a variable holding that shape).

**Severity:** High.

**Risky example:**
```js
const { spawn } = require('child_process');
function run(name) {
  spawn("echo " + name, [], { shell: true });
}
```

**Safe examples:**
```js
execFile("git", ["status"]);              // a different, safer API — out of scope entirely, never flagged
spawn("echo", [name]);                     // no shell: true — NOT flagged
```

**Limitations:** Only recognizes a literal inline options object — an options object built elsewhere and passed in by reference is not tracked.

**Tests:** `tests/fixtures/vulnerable/node-spawn-shell-true-dynamic.ts` · `tests/fixtures/safe/node-execfile-fixed-args.ts`, `node-spawn-no-shell.ts`
