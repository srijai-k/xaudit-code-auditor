import { parse } from "@babel/parser";
import type { File } from "@babel/types";

/**
 * Single parser entry point for all JS/TS/JSX/TSX input.
 *
 * Choice of parser: @babel/parser + @babel/traverse (documented rationale in
 * docs/architecture.md). We parse with both the `jsx` and `typescript`
 * plugins enabled unconditionally, which lets Babel accept the union of
 * JS, TS, JSX and TSX syntax through one code path — there is no need to ask
 * the user which "mode" they're in for parsing purposes. This is what makes
 * the old, cosmetic HTML/React/JavaScript/Auto selector obsolete: for
 * anything that isn't HTML, exactly one parser and one rule set runs,
 * regardless of what the user calls their file.
 *
 * We deliberately do NOT run the TypeScript type checker (no `tsc`, no
 * `typescript-estree` type information). This is a syntax/shape-level AST
 * only — rules can see "this is a call to db.query with a template literal
 * argument" but cannot see inferred types. That is a real limitation and is
 * disclosed in every rule module.
 *
 * `decorators-legacy` (not the newer `decorators` plugin) is enabled
 * specifically because it matches what real decorator-using TypeScript
 * actually looks like today: NestJS, Angular, TypeORM entities, and
 * class-validator DTOs all target `experimentalDecorators` (the legacy
 * proposal), including parameter decorators (`findOne(@Param('id') id)`).
 * The newer TC39 stage-3 `decorators` plugin was checked and rejected for
 * this reason — it dropped parameter decorators entirely, so it would fail
 * to parse the single most common real-world decorator shape. Before this
 * was added, ANY file using a class/method/parameter decorator failed to
 * parse at all and got zero analysis coverage, silently — a bigger
 * reliability gap than any one rule's blind spot, since it wasn't a missed
 * finding, it was a missed *file*. See docs/model-improvements.md.
 *
 * One syntax is a known, permanent limitation rather than something to fix:
 * old-style TypeScript angle-bracket casts (`<Foo>value`) are ambiguous
 * with JSX once the `jsx` plugin is on (which it always is here, since
 * this parser doesn't know a file's real extension) — this is the same
 * reason the TypeScript compiler itself rejects that syntax in `.tsx`
 * files and recommends `value as Foo` instead. Not fixable without knowing
 * whether the input is meant to be JSX, which this tool deliberately
 * doesn't ask.
 */
export interface ParseSuccess {
    ok: true;
    ast: File;
}

export interface ParseFailure {
    ok: false;
    error: string;
    location?: { line: number; column: number };
}

export type ParseOutcome = ParseSuccess | ParseFailure;

export function parseSource(code: string): ParseOutcome {
    try {
        const ast = parse(code, {
            sourceType: "unambiguous",
            errorRecovery: false,
            plugins: [
                "jsx",
                "typescript",
                "classProperties",
                "objectRestSpread",
                "optionalChaining",
                "nullishCoalescingOperator",
                "topLevelAwait",
                "decorators-legacy",
            ],
        });
        return { ok: true, ast };
    } catch (err) {
        const e = err as { message?: string; loc?: { line: number; column: number } };
        return {
            ok: false,
            error: e.message || "Unknown parse error",
            location: e.loc ? { line: e.loc.line, column: e.loc.column } : undefined,
        };
    }
}
