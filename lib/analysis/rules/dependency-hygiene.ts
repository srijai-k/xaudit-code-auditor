import type { Finding, Severity } from "../types";

/**
 * Rule group G — supply-chain hygiene checks for a pasted `package.json`.
 *
 * This is explicitly NOT vulnerability/CVE scanning. There is no offline
 * advisory database integrated, and nothing here claims to know whether
 * any specific package version has a known vulnerability. What this
 * checks instead — real, verifiable from the manifest text alone,
 * requiring no network call and no advisory data:
 *
 *   1. Unpinned version ranges (`"*"`, `"latest"`) in any dependency
 *      block — accepts any published version, including one published
 *      after a maintainer-account compromise.
 *   2. Non-registry dependency sources (git/URL/file specifiers) —
 *      bypass npm registry-level integrity checks; a mutable git ref can
 *      change what code you get without any version bump.
 *   3. Suspicious content inside a `scripts` entry — a regex match for
 *      patterns real supply-chain compromises have used (piping a remote
 *      download into a shell, a base64-decode step, dynamic `eval`).
 *      This is a pattern match on text, not an execution or full
 *      understanding of the script — see the finding's own limitations.
 *   4. Presence of an install-time lifecycle script (`preinstall`,
 *      `install`, `postinstall`, `prepare`) — informational only. The
 *      overwhelming majority of these are completely legitimate (native
 *      module builds, git hooks via husky); this exists purely to
 *      surface "there is code that runs automatically on install here,"
 *      not to claim anything is wrong.
 *   5. A well-known development-tool package name (a linter, test
 *      runner, bundler, `@types/*`, etc.) declared in `dependencies`
 *      instead of `devDependencies` — a name-pattern heuristic, not a
 *      usage analysis.
 *
 * Deliberately NOT implemented, on purpose, not by oversight:
 *   - Missing-lockfile detection. This tool only ever sees pasted text —
 *     if a user doesn't paste a `package-lock.json`, that's
 *     indistinguishable from "doesn't have one," which is too weak and
 *     potentially misleading a signal to report as a finding.
 *   - Any CVE/known-vulnerability lookup. That would require an offline,
 *     versioned advisory database this project does not have, and
 *     claiming otherwise is exactly the kind of overclaim this project's
 *     own rewrite exists to avoid.
 *   - Whether a dependency is *actually* used anywhere in your code
 *     (check #5 is name-pattern only) — this engine analyzes one pasted
 *     file at a time, not a whole repository.
 */

const UNPINNED_VERSION_PATTERN = /^(\*|x|latest)$/i;
const NON_REGISTRY_SPEC_PATTERN = /^(git\+|git:\/\/|https?:\/\/|github:|gitlab:|bitbucket:|file:)/i;
const KNOWN_DEV_TOOL_NAME_PATTERN = /^(eslint|prettier|jest|vitest|webpack|rollup|parcel|karma|jasmine|mocha|chai|sinon|nyc|c8|standard|xo|stylelint|nodemon|husky|lint-staged|ts-node|tsx|typescript|babel-|@babel\/|@testing-library\/|@types\/|@playwright\/|cypress|playwright)/i;
const SUSPICIOUS_SCRIPT_PATTERN = /(curl|wget)\s[^|]*\|\s*(sh|bash|zsh)\b|base64\s+(-d|--decode)\b|\bnode\s+-e\b|\beval\s*\(/i;
const LIFECYCLE_SCRIPT_NAMES = new Set(["preinstall", "install", "postinstall", "prepare", "prepublish"]);
const DEPENDENCY_BLOCKS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"] as const;

export type PackageJsonParseResult = { ok: true; data: Record<string, unknown> } | { ok: false; error: string };

/** Parses raw text as a package.json object. Not an npm-schema validator — just enough to reject non-object JSON cleanly. */
export function parsePackageJson(code: string): PackageJsonParseResult {
    let data: unknown;
    try {
        data = JSON.parse(code);
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
        return { ok: false, error: "Valid JSON, but not a JSON object at the top level — a package.json must be a single object." };
    }
    return { ok: true, data: data as Record<string, unknown> };
}

/** Lightweight, best-effort source location for a JSON key — a text search, not a real JSON AST. Good enough to jump to the right line; not exact for a key name repeated verbatim elsewhere in the file. */
function locate(code: string, needle: string, fromIndex: number): { line: number; column: number; index: number } | undefined {
    const idx = code.indexOf(needle, fromIndex);
    if (idx === -1) return undefined;
    const before = code.slice(0, idx);
    const lastNewline = before.lastIndexOf("\n");
    return { line: before.split("\n").length, column: idx - lastNewline - 1, index: idx };
}

function makeFinding(ruleId: string, title: string, severity: Severity, message: string, whyItMatters: string, saferExample: string, limitations: string, loc: { line: number; column: number } | undefined, snippet: string): Finding {
    return { ruleId, title, severity, category: "dependency-hygiene", message, whyItMatters, saferExample, limitations, location: loc, snippet };
}

function checkDependencyBlock(code: string, deps: Record<string, unknown>, blockName: string, blockStartIndex: number, findings: Finding[]): void {
    let cursor = blockStartIndex;
    for (const [pkg, versionRaw] of Object.entries(deps)) {
        const loc = locate(code, `"${pkg}"`, cursor);
        if (loc) cursor = loc.index + pkg.length;
        const locOut = loc ? { line: loc.line, column: loc.column } : undefined;

        if (typeof versionRaw !== "string") continue;
        const version = versionRaw.trim();

        if (UNPINNED_VERSION_PATTERN.test(version)) {
            findings.push(
                makeFinding(
                    "dep-unpinned-version",
                    `Unpinned version range for "${pkg}"`,
                    "high",
                    `"${pkg}" is declared as "${version}" in ${blockName} — this accepts literally any published version, including one published after a compromise of the maintainer's account.`,
                    "A wildcard or 'latest' version means every fresh install can silently pull in a different, unreviewed release — including a malicious one — with no code change on your side to trigger a review.",
                    `Pin to a specific version or a narrow caret range, e.g. "${pkg}": "^2.4.1", and commit a lockfile so installs are reproducible.`,
                    "Presence check on the declared range only — does not verify what version is actually installed, and cannot see your lockfile (this tool only analyzes the pasted text).",
                    locOut,
                    `"${pkg}": "${version}"`,
                ),
            );
        } else if (NON_REGISTRY_SPEC_PATTERN.test(version)) {
            findings.push(
                makeFinding(
                    "dep-non-registry-source",
                    `"${pkg}" is installed from outside the npm registry`,
                    "medium",
                    `"${pkg}" resolves from a git/URL/file reference ("${version}") in ${blockName}, not a published registry version.`,
                    "Registry-published packages get npm's basic integrity checks; a git ref or arbitrary URL does not, and a mutable git branch/tag can change what code you get on a future install without any version bump.",
                    "Prefer a published, versioned release from the npm registry. If a fork/patch is genuinely required, pin to an exact commit SHA — never a branch or tag — and document why.",
                    "Format match on the version string only — does not evaluate whether the actual source is trustworthy.",
                    locOut,
                    `"${pkg}": "${version}"`,
                ),
            );
        }

        if (blockName === "dependencies" && KNOWN_DEV_TOOL_NAME_PATTERN.test(pkg)) {
            findings.push(
                makeFinding(
                    "dep-devtool-in-dependencies",
                    `"${pkg}" looks like a development-only tool declared as a production dependency`,
                    "low",
                    `"${pkg}" matches a common development-tooling naming pattern (a linter, test runner, bundler, or type package) but is listed in "dependencies" rather than "devDependencies".`,
                    "Production dependencies ship with every install/deploy, unnecessarily growing install size and attack surface for tools that are typically never needed at runtime.",
                    `Move "${pkg}" to "devDependencies" if it is genuinely only used for development, build, or test.`,
                    "Name-pattern heuristic only — does not check actual usage in your code (this engine analyzes one pasted file, not a repository), so it can miss a real dev-only dependency under an unrecognized name and can occasionally flag a package that unusually is needed at runtime.",
                    locOut,
                    `"${pkg}": "${version}"`,
                ),
            );
        }
    }
}

function checkScripts(code: string, scripts: Record<string, unknown>, blockStartIndex: number, findings: Finding[]): void {
    let cursor = blockStartIndex;
    for (const [name, valueRaw] of Object.entries(scripts)) {
        const loc = locate(code, `"${name}"`, cursor);
        if (loc) cursor = loc.index + name.length;
        const locOut = loc ? { line: loc.line, column: loc.column } : undefined;

        if (typeof valueRaw !== "string") continue;

        if (SUSPICIOUS_SCRIPT_PATTERN.test(valueRaw)) {
            findings.push(
                makeFinding(
                    "dep-suspicious-script-content",
                    `Suspicious pattern in the "${name}" script`,
                    "critical",
                    `The "${name}" script contains a pattern commonly seen in supply-chain attacks (piping a remote download into a shell, a base64-decode step, or dynamic code execution).`,
                    "npm runs lifecycle scripts (and any script you run yourself) with your full user permissions and no sandbox. Downloading and executing remote code, or decoding an obfuscated payload, is the exact mechanism used in real npm supply-chain compromises.",
                    "Avoid piping downloads directly into a shell. If a build step genuinely needs an external tool, install it as a normal, versioned dependency instead.",
                    "Pattern match on the script's text only — cannot execute or fully understand the script. A legitimate script could coincidentally match this pattern (rare), and a malicious one could avoid every pattern checked here.",
                    locOut,
                    `"${name}": "${valueRaw.slice(0, 140)}"`,
                ),
            );
        } else if (LIFECYCLE_SCRIPT_NAMES.has(name)) {
            findings.push(
                makeFinding(
                    "dep-lifecycle-script-present",
                    `"${name}" lifecycle script present`,
                    "info",
                    `This package.json defines a "${name}" script, which npm runs automatically during install.`,
                    "Lifecycle scripts are a normal, legitimate mechanism (native module builds, git hooks) but are also the most common vector for a compromised package to run code on your machine during install.",
                    "Review this script's content. `npm install --ignore-scripts` skips lifecycle scripts entirely for packages you haven't reviewed yet.",
                    "Presence check only — the large majority of lifecycle scripts are completely legitimate; this is a pointer to look, not a claim that anything is wrong.",
                    locOut,
                    `"${name}": "${valueRaw.slice(0, 140)}"`,
                ),
            );
        }
    }
}

export function runDependencyHygieneChecks(code: string, data: Record<string, unknown>): Finding[] {
    const findings: Finding[] = [];

    for (const blockName of DEPENDENCY_BLOCKS) {
        const deps = data[blockName];
        if (deps && typeof deps === "object" && !Array.isArray(deps)) {
            const blockStart = locate(code, `"${blockName}"`, 0)?.index ?? 0;
            checkDependencyBlock(code, deps as Record<string, unknown>, blockName, blockStart, findings);
        }
    }

    const scripts = data.scripts;
    if (scripts && typeof scripts === "object" && !Array.isArray(scripts)) {
        const blockStart = locate(code, `"scripts"`, 0)?.index ?? 0;
        checkScripts(code, scripts as Record<string, unknown>, blockStart, findings);
    }

    return findings;
}
