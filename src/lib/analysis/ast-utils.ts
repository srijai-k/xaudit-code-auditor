import type { Node } from "@babel/types";
import * as t from "@babel/types";
import _traverse from "@babel/traverse";
import type { NodePath } from "@babel/traverse";
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
 * This function itself never looks past the expression it's handed — it has
 * no notion of "where did this identifier come from." Rules that want that
 * (xss.ts, sqli.ts) call `resolveSingleAssignment` first and pass the
 * resolved expression in; this function stays a pure, one-node syntax check
 * either way, which is what makes it safe to reuse from multiple rules with
 * different resolution strategies around it.
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

export interface ResolvedBinding {
    resolved: boolean;
    initNode?: t.Node;
}

/**
 * Same-scope variable resolution — the one piece of "follow the value back"
 * every rule that needs it shares. Given an Identifier used at a sink/call
 * site, finds where it was declared and returns that declaration's
 * initializer, but ONLY when the answer is unambiguous:
 *
 *   - the identifier must resolve to a real binding in this file
 *     (`path.scope.getBinding`, Babel's own scope resolution — not a
 *     hand-rolled text search),
 *   - that binding must never be reassigned after its declaration
 *     (`binding.constant` — Babel tracks this for us), and
 *   - the declaration must be a `const`/`let`/`var` with an initializer
 *     (`const x = <expr>`), not a bare `let x;` or a function parameter.
 *
 * If any of that doesn't hold — reassigned, a parameter, destructured, no
 * initializer, declared in an outer function this rule doesn't chase into —
 * this returns `resolved: false` and callers fall back to their existing,
 * already-conservative default for "I don't know what this is." This is
 * deliberately one hop only: it does not chase `const a = b; const c = a;`
 * through a second identifier, and it does not cross function boundaries.
 * That is a real, disclosed limitation — see each rule's own comment for
 * what specifically it does and doesn't catch as a result.
 */
export function resolveSingleAssignment(path: NodePath, node: t.Node): ResolvedBinding {
    if (!t.isIdentifier(node)) return { resolved: false };
    const binding = path.scope.getBinding(node.name);
    if (!binding || !binding.constant) return { resolved: false };
    const declarator = binding.path.node;
    if (t.isVariableDeclarator(declarator) && declarator.init) {
        return { resolved: true, initNode: declarator.init };
    }
    return { resolved: false };
}

// ---------------------------------------------------------------------------
// User-input sources
// ---------------------------------------------------------------------------

/**
 * Where a value comes from, when this engine can tell from the syntax alone.
 * "request" = an incoming HTTP request on the server (Express/Koa-style
 * `req.query`, `req.body`, ...). "browser" = something a visitor controls in
 * the page (the URL, the referrer, `window.name`).
 */
export interface UserInputSource {
    kind: "request" | "browser";
    /** Human label for messages, e.g. "req.query" or "the page URL (location.hash)". */
    label: string;
}

const REQUEST_OBJECT_NAMES = new Set(["req", "request"]);
const REQUEST_INPUT_PROPS = new Set(["query", "body", "params", "headers", "cookies", "signedCookies"]);
const REQUEST_INPUT_METHODS = new Set(["get", "header", "param"]);

/** Root of a member chain plus the property names walked to reach `node`, root-first. */
function memberChain(node: t.Node): { root: t.Node; props: string[] } {
    const props: string[] = [];
    let cur: t.Node = node;
    while (t.isMemberExpression(cur) || t.isOptionalMemberExpression(cur)) {
        const prop = cur.property;
        if (!cur.computed && t.isIdentifier(prop)) props.unshift(prop.name);
        else if (t.isStringLiteral(prop)) props.unshift(prop.value);
        else props.unshift("[]");
        cur = cur.object;
    }
    return { root: cur, props };
}

/**
 * A source recognised at this exact node: a member chain rooted at a request
 * object or a browser global, or a well-known accessor call on one. Name-based
 * (a variable called `req` is assumed to be a request) — disclosed by every
 * rule that uses it.
 */
function directSource(path: NodePath, node: t.Node): UserInputSource | null {
    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
        const { root, props } = memberChain(node);
        if (!t.isIdentifier(root)) return null;
        const [first, second] = props;
        if (REQUEST_OBJECT_NAMES.has(root.name) && REQUEST_INPUT_PROPS.has(first)) {
            return { kind: "request", label: `${root.name}.${first}` };
        }
        if (root.name === "ctx" && (first === "query" || first === "params" || (first === "request" && (second === "body" || second === "query")))) {
            return { kind: "request", label: first === "request" ? `ctx.request.${second}` : `ctx.${first}` };
        }
        if (root.name === "location") return { kind: "browser", label: `the page URL (location${first ? "." + first : ""})` };
        if (root.name === "window" && first === "location") return { kind: "browser", label: `the page URL (window.location${second ? "." + second : ""})` };
        if (root.name === "window" && first === "name") return { kind: "browser", label: "window.name" };
        if (root.name === "document" && (first === "location" || first === "URL" || first === "documentURI")) {
            return { kind: "browser", label: `the page URL (document.${first})` };
        }
        if (root.name === "document" && first === "referrer") return { kind: "browser", label: "document.referrer" };
        return null;
    }
    if (t.isCallExpression(node) && (t.isMemberExpression(node.callee) || t.isOptionalMemberExpression(node.callee))) {
        const callee = node.callee;
        const method = !callee.computed && t.isIdentifier(callee.property) ? callee.property.name : "";
        // req.get('X-Header') / req.header(...) / req.param(...)
        if (t.isIdentifier(callee.object) && REQUEST_OBJECT_NAMES.has(callee.object.name) && REQUEST_INPUT_METHODS.has(method)) {
            return { kind: "request", label: `${callee.object.name}.${method}()` };
        }
        // new URLSearchParams(location.search).get("x"), or params.get("x")
        // one hop back to that, or url.searchParams.get("x") on a URL built
        // from the page's own address.
        if (method === "get") {
            let obj: t.Node = callee.object;
            if (t.isIdentifier(obj)) {
                const r = resolveSingleAssignment(path, obj);
                if (r.resolved && r.initNode) obj = r.initNode;
            }
            if (t.isNewExpression(obj) && t.isIdentifier(obj.callee) && obj.callee.name === "URLSearchParams") {
                const arg = obj.arguments[0];
                if (arg && findUserInput(path, arg, 0)?.kind === "browser") {
                    return { kind: "browser", label: "the page URL's query string" };
                }
            }
            if ((t.isMemberExpression(obj) || t.isOptionalMemberExpression(obj)) && !obj.computed && t.isIdentifier(obj.property) && obj.property.name === "searchParams") {
                if (findUserInput(path, obj.object, 1)?.kind === "browser") return { kind: "browser", label: "the page URL's query string" };
            }
        }
    }
    return null;
}

/** String methods that hand back (part of) the same text — following them keeps the taint. Escaping methods like .replace() deliberately aren't here. */
const PASSTHROUGH_METHODS = new Set([
    "slice", "substring", "substr", "trim", "trimStart", "trimEnd", "toLowerCase", "toUpperCase",
    "toString", "normalize", "padStart", "padEnd", "concat", "join", "at",
]);
/** Plain functions that hand back the same text (decoded or not). Escapers/sanitizers are deliberately absent. */
const PASSTHROUGH_FUNCTIONS = new Set(["decodeURIComponent", "decodeURI", "unescape", "String", "atob"]);
/** Path builders: a user-controlled segment survives them intact, which is exactly the path-traversal concern. */
const PATH_BUILDERS = new Set(["join", "resolve"]);

/**
 * Does this expression carry user input? Looks at the node itself, then
 * through string building (`+`, template literals), `a || b` / `a ? b : c`,
 * `await`, TS casts, text-preserving method calls (`.trim()`, `.slice()`),
 * a short list of pass-through functions (`decodeURIComponent`, `String`,
 * `path.join`), and — `hops` times, default once — back through a
 * never-reassigned variable to its declaration (including destructuring:
 * `const { name } = req.query`). Calls to anything else are treated as
 * opaque on purpose: `escapeHtml(req.query.x)` must NOT count as raw input.
 */
export function findUserInput(path: NodePath, node: t.Node, hops = 1, depth = 0): UserInputSource | null {
    if (depth > 12) return null;
    const next = (n: t.Node, h = hops) => findUserInput(path, n, h, depth + 1);

    const direct = directSource(path, node);
    if (direct) return direct;

    if (t.isIdentifier(node)) {
        if (hops <= 0) return null;
        const r = resolveSingleAssignment(path, node);
        return r.resolved && r.initNode ? next(r.initNode, hops - 1) : null;
    }
    if ((t.isMemberExpression(node) || t.isOptionalMemberExpression(node))) {
        // `data.name` where `const data = req.body`: follow the chain's root one hop.
        const { root } = memberChain(node);
        if (t.isIdentifier(root) && hops > 0) {
            const r = resolveSingleAssignment(path, root);
            if (r.resolved && r.initNode) return next(r.initNode, hops - 1);
        }
        return null;
    }
    if (t.isBinaryExpression(node) && node.operator === "+") return next(node.left) ?? next(node.right);
    if (t.isTemplateLiteral(node)) {
        for (const e of node.expressions) {
            const s = next(e);
            if (s) return s;
        }
        return null;
    }
    if (t.isLogicalExpression(node)) return next(node.left) ?? next(node.right);
    if (t.isConditionalExpression(node)) return next(node.consequent) ?? next(node.alternate);
    if (t.isAwaitExpression(node)) return next(node.argument);
    if (t.isTSAsExpression(node) || t.isTSNonNullExpression(node) || t.isParenthesizedExpression(node)) return next(node.expression);
    if (t.isCallExpression(node)) {
        const callee = node.callee;
        const firstArg = node.arguments[0];
        if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property)) {
            const method = callee.property.name;
            // path.join/resolve first: "join" is also an array/string method below.
            if (t.isIdentifier(callee.object) && callee.object.name === "path" && PATH_BUILDERS.has(method)) {
                for (const a of node.arguments) {
                    const s = t.isExpression(a) ? next(a) : null;
                    if (s) return s;
                }
                return null;
            }
            if (PASSTHROUGH_METHODS.has(method)) return next(callee.object);
            return null;
        }
        if (t.isIdentifier(callee)) {
            if (PASSTHROUGH_FUNCTIONS.has(callee.name) && firstArg && t.isExpression(firstArg)) return next(firstArg);
            if (PATH_BUILDERS.has(callee.name)) {
                for (const a of node.arguments) {
                    const s = t.isExpression(a) ? next(a) : null;
                    if (s) return s;
                }
            }
        }
        return null;
    }
    return null;
}

// ---------------------------------------------------------------------------
// Values that can't carry markup
// ---------------------------------------------------------------------------

const NUMERIC_BINARY_OPS = new Set(["-", "*", "/", "%", "**", "|", "&", "^", "<<", ">>", ">>>", "<", ">", "<=", ">=", "==", "===", "!=", "!=="]);
const NUMBER_FUNCTIONS = new Set(["Number", "parseInt", "parseFloat", "Boolean", "isNaN", "isFinite"]);
const NUMBER_FORMAT_METHODS = new Set(["toFixed", "toPrecision", "toExponential"]);

/**
 * True when the value provably can't contain HTML: numbers, booleans,
 * literal strings, and text built only from those — `count * 2`,
 * `items.length`, `parseInt(x)`, `price.toFixed(2)`, `String(total)` when
 * `total` itself is one of these, `"Total: " + n` when `n` is. Follows a
 * never-reassigned variable back once. Anything it can't prove stays
 * not-inert, so the caller keeps flagging it.
 *
 * One deliberate assumption: `.length` is treated as a number. That's true
 * for strings and arrays; an attacker-shaped object with a string `length`
 * property would slip through. Disclosed in the XSS rule's limitations.
 */
export function isInertValue(path: NodePath, node: t.Node, hops = 1, depth = 0): boolean {
    if (depth > 12) return false;
    const inert = (n: t.Node, h = hops) => isInertValue(path, n, h, depth + 1);

    if (t.isNumericLiteral(node) || t.isBooleanLiteral(node) || t.isNullLiteral(node) || t.isBigIntLiteral(node)) return true;
    if (isStaticStringExpression(node)) return true;
    // -x, +x, ~x, !x, typeof x, void x, delete x: a number, a boolean, a type name or undefined.
    if (t.isUnaryExpression(node)) return true;
    if (t.isBinaryExpression(node)) {
        if (NUMERIC_BINARY_OPS.has(node.operator)) return true;
        if (node.operator === "+") return t.isExpression(node.left) && inert(node.left) && inert(node.right);
        return false;
    }
    if (t.isTemplateLiteral(node)) return node.expressions.every((e) => inert(e));
    if (t.isConditionalExpression(node)) return inert(node.consequent) && inert(node.alternate);
    if (t.isTSAsExpression(node) || t.isTSNonNullExpression(node) || t.isParenthesizedExpression(node)) return inert(node.expression);
    if ((t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) && !node.computed && t.isIdentifier(node.property) && node.property.name === "length") {
        return true;
    }
    if (t.isCallExpression(node)) {
        const callee = node.callee;
        if (t.isIdentifier(callee)) {
            if (NUMBER_FUNCTIONS.has(callee.name)) return true;
            if (callee.name === "String") {
                const a = node.arguments[0];
                return !!a && t.isExpression(a) && inert(a);
            }
            return false;
        }
        if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property)) {
            const method = callee.property.name;
            if (t.isIdentifier(callee.object) && callee.object.name === "Math") return true;
            if (t.isIdentifier(callee.object) && callee.object.name === "Date" && method === "now") return true;
            if (NUMBER_FORMAT_METHODS.has(method)) return true;
            if (method === "toString" || method === "toLocaleString") return inert(callee.object);
        }
        return false;
    }
    if (t.isIdentifier(node)) {
        if (hops <= 0) return false;
        const r = resolveSingleAssignment(path, node);
        return r.resolved && !!r.initNode && inert(r.initNode, hops - 1);
    }
    return false;
}

/** Splits camelCase / snake_case / kebab-case into lowercase words: "resetToken" -> ["reset", "token"]. Name rules match whole words with this, so "footprint" is never an "otp". */
export function wordsOf(name: string): string[] {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((w) => w.toLowerCase());
}

/** Renders a short, single-line source excerpt for a node, capped in length. */
export function excerptOf(code: string, node: { start?: number | null; end?: number | null }, max = 160): string {
    if (node.start == null || node.end == null) return "";
    const raw = code.slice(node.start, node.end).replace(/\s+/g, " ").trim();
    return raw.length > max ? raw.slice(0, max) + "…" : raw;
}
