# Rule documentation

One page per rule module. Each individual `ruleId` has its own stable anchor on its module's page (e.g. `xss.md#xss-inner-html`) — this is what the [SARIF export](../../src/lib/export/sarif-generator.ts)'s `helpUri` links to for every finding.

| Module | Category | `ruleId`s documented |
|---|---|---|
| [`xss.md`](xss.md) | `xss` | `xss-inner-html`, `xss-outer-html`, `xss-iframe-srcdoc`, `xss-insert-adjacent-html`, `xss-document-write`, `xss-document-writeln`, `xss-dangerously-set-inner-html`, `xss-jquery-html`, `xss-location-javascript-uri`, `xss-setattribute-javascript-uri`, `xss-jsx-href-javascript-uri` |
| [`sqli.md`](sqli.md) | `sqli` | `sqli-dynamic-query` |
| [`secrets.md`](secrets.md) | `secrets` | `secret-anthropic`, `secret-openai`, `secret-stripe`, `secret-aws`, `secret-github-pat`, `secret-gitlab-pat`, `secret-slack-token`, `secret-rsa-private-key`, `secret-google-api-key`, `secret-generic-assignment`, `secret-high-entropy-string` |
| [`dynamic-exec.md`](dynamic-exec.md) | `dynamic-exec` | `exec-eval`, `exec-function-ctor`, `exec-set-timeout-string`, `exec-set-interval-string` |
| [`node-command.md`](node-command.md) | `node-command` | `node-command-exec-dynamic`, `node-command-spawn-shell` |
| [`auth.md`](auth.md) | `auth` | `auth-hardcoded-credential-comparison`, `auth-jwt-decode-without-verify` |
| [`dependency-hygiene.md`](dependency-hygiene.md) | `dependency-hygiene` | `dep-unpinned-version`, `dep-non-registry-source`, `dep-suspicious-script-content`, `dep-lifecycle-script-present`, `dep-devtool-in-dependencies` |
| [`html.md`](html.md) | `html` | `html-missing-viewport`, `html-missing-alt`, `html-inline-event-handler`, `html-missing-csp-meta`, `html-script-content-not-analyzed` |

Every entry follows the same structure: what it flags, severity and why, a risky example, a safe example (and why it's *not* flagged — usually the more informative half), known limitations, and which tests exercise it. All examples are pulled verbatim or near-verbatim from the actual, currently-passing test corpus (`tests/fixtures/`, `tests/independent-benchmark/`) — nothing here is illustrative-only or unverified.

For the engine-wide picture (architecture, what's *not* implemented, benchmark numbers), see the main [README](../../README.md) and [`docs/model-improvements.md`](../model-improvements.md).
