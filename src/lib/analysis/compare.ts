import type { Finding } from "./types";

/**
 * "Did the fix actually work?" Compares the findings from a check with the
 * findings from a later check of a fixed version of the same code.
 *
 * Line numbers can't be used to match findings up: a fix moves everything
 * around. So matching goes in two passes, and errs toward NOT claiming a fix:
 *   1. Same rule and same code excerpt (whitespace-insensitive): the same
 *      problem, untouched. "Still there."
 *   2. Whatever is left is paired up by rule alone. If the before had two
 *      xss-inner-html findings and the after still has two, both count as
 *      "still there" even if the code around them was reworded - renaming a
 *      variable doesn't make an innerHTML assignment safe.
 * Only what can't be paired at all counts: leftovers from the before are
 * "fixed", leftovers from the after are "introduced".
 *
 * Pure function, no DOM, no storage: the checker page calls it, tests call it.
 */
export interface RunComparison {
    fixed: Finding[];
    stillThere: Finding[];
    introduced: Finding[];
}

const normalize = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export function compareRuns(before: Finding[], after: Finding[]): RunComparison {
    const remainingAfter = [...after];
    const stillThere: Finding[] = [];
    const unmatchedBefore: Finding[] = [];

    for (const f of before) {
        const i = remainingAfter.findIndex((g) => g.ruleId === f.ruleId && normalize(g.snippet) === normalize(f.snippet));
        if (i >= 0) stillThere.push(remainingAfter.splice(i, 1)[0]);
        else unmatchedBefore.push(f);
    }

    const fixed: Finding[] = [];
    for (const f of unmatchedBefore) {
        const i = remainingAfter.findIndex((g) => g.ruleId === f.ruleId);
        if (i >= 0) stillThere.push(remainingAfter.splice(i, 1)[0]);
        else fixed.push(f);
    }

    return { fixed, stillThere, introduced: remainingAfter };
}
