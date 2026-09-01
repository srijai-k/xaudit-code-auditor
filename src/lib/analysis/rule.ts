import type { File } from "@babel/types";
import type { Finding } from "./types";

/** Context handed to every AST rule. Rules are pure functions: (ast, code) -> Finding[]. */
export interface RuleContext {
    ast: File;
    code: string;
}

export interface Rule {
    id: string;
    /** Which categories/groups this rule belongs to, for docs and the benchmark report. */
    category: Finding["category"];
    /** Human title used in docs; individual findings may specialize this. */
    title: string;
    run(ctx: RuleContext): Finding[];
}
