import type { Finding } from "./types";

/**
 * Deduplicates findings that point at the exact same rule + source range.
 * This can legitimately happen when two rules' AST selectors both match a
 * node (rare, but possible for overlapping categories) — we keep the first
 * occurrence and drop the rest rather than showing the same line twice.
 */
export function dedupeFindings(findings: Finding[]): Finding[] {
    const seen = new Set<string>();
    const out: Finding[] = [];
    for (const f of findings) {
        const key = `${f.ruleId}:${f.location?.line ?? "?"}:${f.location?.column ?? "?"}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(f);
    }
    return out;
}
