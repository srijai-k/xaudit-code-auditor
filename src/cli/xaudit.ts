// XAUDIT on the command line: the same engine the website runs in a Web
// Worker, pointed at files on disk instead of a paste. Nothing here touches
// the network - it reads files, runs analyze(), prints or writes a report.
//
//   npm run xaudit -- src/                       # readable list, exit 1 on any high/critical
//   npm run xaudit -- . --format sarif --output xaudit.sarif
//   npm run xaudit -- server.js --fail-on medium
//
// Exit codes: 0 = nothing at or above --fail-on, 1 = findings at or above
// it, 2 = bad usage.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { analyze, type AnalysisMode } from "../lib/analysis/analyze";
import { generateSarifForFiles } from "../lib/export/sarif-generator";
import { MAX_SOURCE_BYTES, type AnalysisResult, type Severity } from "../lib/analysis/types";

const SEVERITY_RANK: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
const SCRIPT_EXT = /\.(js|jsx|ts|tsx|mjs|cjs|mts|cts)$/i;
const HTML_EXT = /\.html?$/i;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", "coverage", ".next", ".nuxt", ".vercel", ".turbo", "vendor"]);

interface Options {
    paths: string[];
    format: "text" | "json" | "sarif";
    output?: string;
    failOn: Severity | "none";
}

const USAGE = `Usage: xaudit [paths...] [--format text|json|sarif] [--output <file>] [--fail-on critical|high|medium|low|info|none]

Checks JavaScript, TypeScript, React/JSX, HTML and package.json files.
Defaults: path ".", format "text", fail-on "high".
Skips node_modules, .git, dist, build, coverage and similar folders.`;

function parseArgs(argv: string[]): Options {
    const opts: Options = { paths: [], format: "text", failOn: "high" };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        const value = () => {
            const v = argv[++i];
            if (v === undefined) fail(`${a} needs a value`);
            return v;
        };
        if (a === "--help" || a === "-h") {
            console.log(USAGE);
            process.exit(0);
        } else if (a === "--format") {
            const v = value();
            if (v !== "text" && v !== "json" && v !== "sarif") fail(`unknown format "${v}"`);
            opts.format = v;
        } else if (a === "--output" || a === "-o") {
            opts.output = value();
        } else if (a === "--fail-on") {
            const v = value();
            if (v !== "none" && !(v in SEVERITY_RANK)) fail(`unknown severity "${v}"`);
            opts.failOn = v as Options["failOn"];
        } else if (a.startsWith("-")) {
            fail(`unknown option ${a}`);
        } else {
            opts.paths.push(a);
        }
    }
    if (opts.paths.length === 0) opts.paths.push(".");
    return opts;
}

function fail(message: string): never {
    console.error(`xaudit: ${message}\n\n${USAGE}`);
    process.exit(2);
}

function modeFor(file: string): AnalysisMode | null {
    if (path.basename(file) === "package.json") return "package-json";
    if (HTML_EXT.test(file)) return "html";
    if (SCRIPT_EXT.test(file)) return "script";
    return null;
}

function collect(target: string, out: string[]): void {
    let st;
    try {
        st = statSync(target);
    } catch {
        fail(`can't read ${target}`);
    }
    if (st.isDirectory()) {
        for (const entry of readdirSync(target).sort()) {
            if (SKIP_DIRS.has(entry)) continue;
            collect(path.join(target, entry), out);
        }
    } else if (modeFor(target)) {
        out.push(target);
    }
}

const toPosix = (p: string) => p.split(path.sep).join("/");

function main(): void {
    const opts = parseArgs(process.argv.slice(2));
    const files: string[] = [];
    for (const p of opts.paths) collect(p, files);

    const results: { uri: string; result: AnalysisResult }[] = [];
    const skipped: string[] = [];
    for (const file of files) {
        const code = readFileSync(file, "utf8");
        if (Buffer.byteLength(code) > MAX_SOURCE_BYTES) {
            skipped.push(`${toPosix(file)} (over ${MAX_SOURCE_BYTES / 1024} KB)`);
            continue;
        }
        const result = analyze(code, modeFor(file)!);
        if (result.status === "parse-error") skipped.push(`${toPosix(file)} (${result.error})`);
        results.push({ uri: toPosix(path.relative(process.cwd(), file) || file), result });
    }

    const all = results.flatMap((r) => r.result.findings.map((f) => ({ file: r.uri, f })));
    let report: string;
    if (opts.format === "sarif") {
        report = JSON.stringify(generateSarifForFiles(results.filter((r) => r.result.status === "ok")), null, 2);
    } else if (opts.format === "json") {
        report = JSON.stringify({ tool: "XAUDIT", files: results, skipped }, null, 2);
    } else {
        const lines: string[] = [];
        for (const { file, f } of all.sort((a, b) => SEVERITY_RANK[b.f.severity] - SEVERITY_RANK[a.f.severity] || a.file.localeCompare(b.file))) {
            const where = f.location ? `${file}:${f.location.line}:${f.location.column + 1}` : file;
            lines.push(`${where}  ${f.severity.toUpperCase().padEnd(8)} ${f.ruleId}  ${f.title}`);
        }
        const counts = (Object.keys(SEVERITY_RANK) as Severity[]).reverse().map((s) => `${all.filter((x) => x.f.severity === s).length} ${s}`).join(", ");
        lines.push("", `Checked ${results.length} file(s): ${all.length} finding(s) (${counts}).`);
        if (skipped.length) lines.push(`Not checked: ${skipped.join("; ")}`);
        lines.push("Findings are patterns worth a look, not confirmed bugs. No findings doesn't mean the code is safe.");
        report = lines.join("\n");
    }

    if (opts.output) {
        writeFileSync(opts.output, report + "\n");
        console.log(`xaudit: ${all.length} finding(s) in ${results.length} file(s), report written to ${opts.output}`);
    } else {
        console.log(report);
    }

    if (opts.failOn !== "none") {
        const threshold = SEVERITY_RANK[opts.failOn];
        if (all.some(({ f }) => SEVERITY_RANK[f.severity] >= threshold)) process.exit(1);
    }
}

main();
