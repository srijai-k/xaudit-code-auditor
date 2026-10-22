# Command line and GitHub Action

The website checks a paste. The same engine can check a whole project, on your machine or on every pull request. It runs offline either way: files are read from disk, nothing is uploaded.

## Command line

From a clone of this repo (after `npm install`):

```bash
npm run xaudit -- path/to/your/project
```

| Option | What it does | Default |
|---|---|---|
| `--format text\|json\|sarif` | Readable list, the full result as JSON, or SARIF 2.1.0 for code-scanning tools | `text` |
| `--output <file>` | Write the report to a file instead of the terminal | (terminal) |
| `--fail-on <severity>` | Exit with code 1 if anything is at or above `critical`/`high`/`medium`/`low`/`info`; `none` never fails | `high` |

Exit codes: `0` nothing at or above `--fail-on`, `1` findings at or above it, `2` bad usage.

It checks `.js .jsx .ts .tsx .mjs .cjs .mts .cts .html .htm` files and files named exactly `package.json`, and skips `node_modules`, `.git`, `dist`, `build`, `out`, `coverage`, `.next`, `.nuxt`, `.vercel`, `.turbo` and `vendor`. Files over 500 KB, or that don't parse, are listed as "not checked" rather than silently dropped.

It isn't published to npm yet, so it runs through `tsx` from this repo. Publishing it as `npx xaudit` needs a build step first.

## GitHub Action

Add `.github/workflows/xaudit.yml` to any repository:

```yaml
name: XAUDIT
on: [push, pull_request]

permissions:
  contents: read
  security-events: write   # needed to upload to code scanning

jobs:
  xaudit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: srijai-k/xaudit-code-auditor@main
        with:
          path: src
          fail-on: high

      - uses: github/codeql-action/upload-sarif@v3
        if: always()            # upload even when the check step failed the job
        with:
          sarif_file: xaudit.sarif
```

Findings then show up on the pull request and under **Security → Code scanning**, each linked to its rule's page in `docs/rules/`. To only see the report without failing builds, set `fail-on: none`.

**Pin a version for real use.** `@main` follows whatever is on the main branch. Once releases are tagged, use a tag (`@v1`) or a commit SHA instead.

## What it is and isn't

The same rules and the same limitations as the website: narrow pattern checks with one variable hop and no cross-file tracking. Every finding in the SARIF carries its own `limitations` text. A clean run means none of XAUDIT's rules matched, not that the code is secure.
