import type { Finding } from "../types";

/**
 * HTML checks — attribute/text presence checks over the raw markup string.
 *
 * These are NOT AST-based (there is no HTML parser in this engine) and are
 * NOT security rules in the sense of rule groups A–E. They are basic
 * structural/hygiene checks: missing viewport meta, missing alt text,
 * missing CSP meta tag, obvious inline event-handler attributes written as
 * raw HTML (`onclick="..."` with a literal quote — not to be confused with
 * JSX `onClick={fn}`, which this module never looks at because it only
 * runs in "HTML" mode on markup files, never on JS/TS/JSX source).
 *
 * Severity here tops out at "medium" — presence/absence of an attribute is
 * not proof of a vulnerability, only a hygiene gap.
 *
 * Inline <script> content used to be a total blind spot in HTML mode: the
 * five real detection rules (XSS, SQLi, secrets, dynamic-exec,
 * node-command) only ever ran in "JS/TS/React" mode, and a user who
 * manually selected HTML mode on markup with real script content got a
 * silent, clean report with no indication the script was never examined
 * at all — see docs/self-audit-2026-09-03.md, F-05. That gap is now
 * partly closed: analyze.ts extracts each inline <script> block (via
 * extractInlineScripts below, still pure text scanning — the AST work
 * happens in analyze.ts, not here, keeping this module's own "not part of
 * the AST engine" boundary intact) and runs it through the same rules
 * JS/TS/React mode uses. buildScriptNotAnalyzedFinding is the honest
 * fallback for a block that doesn't parse (info severity, not a claim
 * about the script's content) — analyze.ts calls it per-block rather than
 * once for the whole file, so a script that DID get analyzed is never
 * followed by a contradictory "this wasn't examined" disclosure sitting
 * next to real findings from examining it.
 */

function lineOf(code: string, index: number): number {
    return code.slice(0, index).split("\n").length;
}

export function runHtmlChecks(code: string): Finding[] {
    const findings: Finding[] = [];

    // Missing viewport meta tag (only meaningful for full HTML documents).
    if (/<html[\s>]/i.test(code) && !/<meta[^>]+name=["']viewport["']/i.test(code)) {
        findings.push({
            ruleId: "html-missing-viewport",
            title: "Missing viewport meta tag",
            severity: "medium",
            category: "html",
            message: "No <meta name=\"viewport\" ...> tag was found in this HTML document.",
            whyItMatters: "Without it, mobile browsers render the page at desktop width, which breaks responsive layout. This is a UX/rendering issue, not a security issue.",
            saferExample: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            limitations: "Presence check only — does not evaluate whether the viewport configuration is actually correct.",
        });
    }

    // Missing alt attribute on <img> tags.
    const imgTags = code.match(/<img\b[^>]*>/gi) || [];
    let missingAlt = 0;
    for (const tag of imgTags) {
        if (!/alt\s*=/i.test(tag) || /alt\s*=\s*["']\s*["']/i.test(tag)) missingAlt++;
    }
    if (missingAlt > 0) {
        findings.push({
            ruleId: "html-missing-alt",
            title: "Image(s) missing alt text",
            severity: "low",
            category: "html",
            message: `${missingAlt} of ${imgTags.length} <img> tag(s) have no (or empty) alt attribute.`,
            whyItMatters: "Screen readers cannot describe the image to users who rely on them. This is an accessibility issue, not a security issue.",
            saferExample: '<img src="chart.png" alt="Quarterly revenue chart showing a 12% increase">',
            limitations: "Attribute-presence check only; does not evaluate whether existing alt text is meaningful.",
        });
    }

    // Raw inline HTML event-handler attributes: onclick="...", onerror="...", etc.
    // Requires a literal quote immediately after `=` to avoid any possibility
    // of matching a JSX `onClick={handler}` prop — this module only ever
    // receives markup classified as HTML mode, but the pattern is written
    // defensively regardless.
    const inlineHandlerMatches = [...code.matchAll(/\son([a-z]+)\s*=\s*["']/gi)];
    if (inlineHandlerMatches.length > 0) {
        const names = [...new Set(inlineHandlerMatches.map((m) => `on${m[1]}`))].join(", ");
        findings.push({
            ruleId: "html-inline-event-handler",
            title: "Inline HTML event-handler attribute",
            severity: "medium",
            category: "html",
            message: `Found ${inlineHandlerMatches.length} inline event-handler attribute(s) written directly in markup (${names}).`,
            whyItMatters: "Inline handlers mix markup and behavior and are a common target when HTML is built by concatenating untrusted strings. This check only looks at literal HTML attributes — it never inspects JSX/React event props.",
            saferExample: "el.addEventListener('click', handler) in a separate script, or a framework's event-binding syntax.",
            limitations: "Presence check only; does not know whether this markup is ever built from untrusted input.",
            location: { line: lineOf(code, inlineHandlerMatches[0].index ?? 0), column: 0 },
        });
    }

    // Missing CSP meta tag, only for full documents, informational.
    if (/<html[\s>]/i.test(code) && !/<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(code)) {
        findings.push({
            ruleId: "html-missing-csp-meta",
            title: "No Content-Security-Policy meta tag",
            severity: "info",
            category: "html",
            message: "No CSP meta tag was found in this document.",
            whyItMatters: "A CSP is more commonly and more effectively delivered as an HTTP response header, not a meta tag — this check cannot see server headers at all, so its absence here is weak signal either way.",
            saferExample: 'Prefer a `Content-Security-Policy` HTTP header set by your server/host over a meta tag.',
            limitations: "This checker only ever sees the pasted markup text, never the HTTP headers a real deployment would send. Treat this as a reminder, not a finding about your actual deployed security posture.",
        });
    }

    return findings;
}

export interface ExtractedScriptBlock {
    content: string;
    /** 1-based line number, in the ORIGINAL document, of this block's first content character. */
    startLine: number;
}

// Script types that actually execute as JS in a browser. Everything else
// (application/json, application/ld+json, text/template, a framework's
// own custom type, etc.) is inert markup as far as the five real
// detection rules are concerned — attempting to parse it as JavaScript
// would either throw or, worse, silently misparse it.
const EXECUTABLE_SCRIPT_TYPES = new Set(["text/javascript", "application/javascript", "module", "text/babel", "text/jsx"]);

/**
 * Pure text extraction — still no HTML parser, matching this module's own
 * architecture. Finds inline <script> blocks with real content, skipping
 * external scripts (`src="..."`, nothing to extract) and non-executable
 * script types. Each block's starting line is computed against the
 * ORIGINAL document so a caller that re-analyzes the extracted content in
 * isolation can shift findings' line numbers back to where they actually
 * are in the file the user pasted.
 */
export function extractInlineScripts(code: string): ExtractedScriptBlock[] {
    const blocks: ExtractedScriptBlock[] = [];
    const pattern = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(code))) {
        const attrs = match[1];
        const content = match[2];
        if (/\bsrc\s*=/i.test(attrs)) continue;
        const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
        if (typeMatch && !EXECUTABLE_SCRIPT_TYPES.has(typeMatch[1].toLowerCase().trim())) continue;
        if (content.trim().length === 0) continue;
        const openTagLength = "<script".length + attrs.length + ">".length;
        const contentStart = match.index + openTagLength;
        blocks.push({ content, startLine: lineOf(code, contentStart) });
    }
    return blocks;
}

/**
 * The honest fallback for one script block that could not be parsed as
 * JavaScript/TypeScript/JSX (e.g. it relies on surrounding template
 * syntax to be valid on its own). Info severity, not a claim about the
 * block's content — it exists purely to disclose that this specific
 * block was not examined by any of the five real detection rules, rather
 * than silently producing a clean result for code that was never
 * actually looked at. See docs/self-audit-2026-09-03.md, F-05.
 */
export function buildScriptNotAnalyzedFinding(startLine: number): Finding {
    return {
        ruleId: "html-script-content-not-analyzed",
        title: "JavaScript inside <script> is not analyzed in HTML mode",
        severity: "info",
        category: "html",
        message: "This inline <script> block's content could not be parsed as standalone JavaScript/TypeScript/JSX (it may depend on surrounding template syntax to be valid), so it was not examined by any of the five real detection rules (XSS, SQL injection, secrets, dynamic execution, Node.js command patterns).",
        whyItMatters: "A real issue inside this script content — a hardcoded secret, an eval() call, an unsanitized innerHTML assignment — will not be flagged here, even though those exact rules exist and would catch it if this exact content were pasted on its own under JS/TS/React mode.",
        saferExample: 'Copy just the code between these <script> tags into the checker separately, using "JS / TS / React" mode, to have it analyzed by the real detection rules.',
        limitations: "This is a per-block fallback, not a claim about the script's content — other <script> blocks in the same document that parse successfully ARE analyzed by the real rules; this disclosure only applies to the one block that didn't.",
        location: { line: startLine, column: 0 },
    };
}
