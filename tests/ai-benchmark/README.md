# Real AI output benchmark

The other two benchmarks (`tests/fixtures/`, `tests/independent-benchmark/`) were written by the same person who wrote the rules. This one is different: the code comes from AI tools, unedited, because that's the code XAUDIT is for.

**Nothing in `responses/` may be written by hand or "cleaned up".** If a response is edited, the benchmark stops meaning anything.

## Collecting responses

1. Open a fresh chat in the tool (no custom instructions, no earlier messages).
2. Paste one prompt from [`prompts.json`](prompts.json) exactly as written.
3. Copy the code from the answer into `responses/<tool>/<prompt-id>.<ext>`, for example `responses/chatgpt/01-login-route.js`. Use `.jsx`/`.tsx` for React, `.html` for HTML, `.json` for package.json. If the answer has several code blocks for one file, paste them in order. If it splits the code into separate files, put each one in its own file named `<prompt-id>--<name>.<ext>`.
4. Add a line to `responses/<tool>/SOURCES.md` with the prompt id, the date, and the model name and version the tool showed.

Tools set up so far: `chatgpt/`, `claude/`, `copilot/`. Add another folder for any other tool.

## Labelling

Run `npm run bench:ai`, then read each response yourself and fill in [`labels.json`](labels.json) (the format is explained at the top of that file). XAUDIT's findings only count as "caught" once a person has confirmed they're real, and problems XAUDIT doesn't report go in `missed`, including ones it has no rule for. A response without a label is listed in the report but not scored.

## Report

`npm run bench:ai` writes [`docs/ai-benchmark-report.md`](../../docs/ai-benchmark-report.md). Re-run it after adding responses or labels. Don't hand-edit the report.
