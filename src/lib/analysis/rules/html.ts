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
