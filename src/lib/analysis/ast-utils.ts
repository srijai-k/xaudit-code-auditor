import type { Node } from "@babel/types";
import * as t from "@babel/types";
import _traverse from "@babel/traverse";
import type { SourceLocation } from "./types";

// @babel/traverse's interop between CJS and ESM bundlers is inconsistent:
// under some bundlers (and under Vitest/Node ESM) the default export is the
// function itself; under others it's wrapped as `{ default: fn }`. Resolve
// once, here, so every rule module imports a working `traverseAst`.
export const traverseAst: typeof _traverse =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof _traverse === "function" ? _traverse : (_traverse as any).default;

export function locOf(node: { loc?: Node["loc"] | null }): SourceLocation | undefined {
    if (!node.loc) return undefined;
    return {
        line: node.loc.start.line,
        column: node.loc.start.column,
        endLine: node.loc.end.line,
        endColumn: node.loc.end.column,
    };
}

/**
 * True only for values that are provably static strings at the syntax level:
 * a plain string literal, or a template literal with no `${...}` substitutions.
 * Anything else (identifiers, member expressions, calls, template literals
 * with interpolation, binary `+` concatenation) is treated as dynamic.
 *
 * Limitation: a `const x = "<b>hi</b>"; el.innerHTML = x;` is NOT recognized
 * as a literal here (we only look at the expression written at the sink
 * call-site, not at variable definitions elsewhere) — this is a direct AST
 * relationship check, not data-flow analysis. Documented, not silently
 * pretended away.
 */
export function isStaticStringExpression(node: t.Node): boolean {
    if (t.isStringLiteral(node)) return true;
    if (t.isTemplateLiteral(node)) return node.expressions.length === 0;
    return false;
}

const SANITIZER_CALLEE_NAMES = new Set([
    "sanitize",
    "sanitizehtml",
    "sanitizeHtml",
]);
const SANITIZER_OBJECT_NAME_PATTERN = /dompurify|xss|sanitize-html/i;

/**
 * Recognizes an explicit allowlist of sanitizer-shaped call expressions,
 * e.g. `DOMPurify.sanitize(x)`, `sanitizeHtml(x)`, `xss(x)`.
 *
 * This is a syntactic allowlist, not a guarantee: it does not check that the
 * sanitizer is imported from the real package, is configured safely, or is
 * even called on the value actually assigned. It only reduces confidence
 * that a sink is "raw", which is why it downgrades severity rather than
 * suppressing the finding entirely.
 */
export function isSanitizerWrapped(node: t.Node): boolean {
    if (!t.isCallExpression(node)) return false;
    const callee = node.callee;
    if (t.isMemberExpression(callee) && !callee.computed) {
        const objectName = t.isIdentifier(callee.object) ? callee.object.name : "";
        const propName = t.isIdentifier(callee.property) ? callee.property.name : "";
        if (SANITIZER_OBJECT_NAME_PATTERN.test(objectName) && /sanitize/i.test(propName)) {
            return true;
        }
        if (SANITIZER_CALLEE_NAMES.has(propName)) return true;
    }
    if (t.isIdentifier(callee) && SANITIZER_CALLEE_NAMES.has(callee.name)) return true;
    return false;
}

/** Renders a short, single-line source excerpt for a node, capped in length. */
export function excerptOf(code: string, node: { start?: number | null; end?: number | null }, max = 160): string {
    if (node.start == null || node.end == null) return "";
    const raw = code.slice(node.start, node.end).replace(/\s+/g, " ").trim();
    return raw.length > max ? raw.slice(0, max) + "…" : raw;
}
