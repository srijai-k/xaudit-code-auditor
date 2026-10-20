import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { traverseAst, locOf, excerptOf, findUserInput, isStaticStringExpression, type UserInputSource } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding, Severity } from "../types";

/**
 * Rule group — request input reaching a dangerous server-side call
 * (Express/Koa-style Node.js handlers).
 *
 * Every check here needs the same thing before it fires: a value that
 * visibly comes from the incoming request (`req.query`, `req.body`,
 * `req.params`, `req.headers`, `req.cookies`, `req.get(...)`, Koa's
 * `ctx.query`/`ctx.params`/`ctx.request.body`) reaching the call — directly,
 * through string building, through a text-preserving method or a path
 * builder, or one never-reassigned variable back (ast-utils.ts
 * findUserInput). A dynamic value from anywhere else is NOT flagged by this
 * module: "any non-literal reaching res.redirect" would fire on nearly
 * every real redirect, the same over-breadth mistake the reverted
 * import()/require() check made (docs/model-improvements.md).
 *
 * Checks:
 *   - express-reflected-xss: request input built into a string passed to
 *     `res.send(...)` (Express sends strings as text/html), or to
 *     `res.write/end(...)` when the string visibly contains markup (`<`).
 *     Whole request objects (`res.send(req.body)`) are skipped: Express
 *     sends those as JSON.
 *   - express-open-redirect: request input as the target of
 *     `res.redirect(...)`, unless the string starts with a fixed same-site
 *     path like "/users/" (a leading "/" alone isn't enough: "/" + "/evil.com"
 *     is the protocol-relative URL //evil.com).
 *   - express-path-traversal: request input in the path given to
 *     `res.sendFile`/`res.download` (unless `{ root: ... }` is passed, which
 *     makes Express refuse paths outside that folder) or to an `fs`
 *     read/write/delete call.
 *   - express-ssrf: request input as the URL of an outgoing request made by
 *     the server (axios, got, http(s).get/request, server-side `fetch`),
 *     unless the string starts with a fixed scheme and host.
 *
 * Two configuration checks don't need request input, because the risky
 * thing is the setting itself:
 *   - express-cors-any-origin-with-credentials: `cors({ origin: true,
 *     credentials: true })` (the cors package then echoes back whatever
 *     Origin a request claims), or a manual Access-Control-Allow-Origin
 *     header set from the request's own Origin in a file that also allows
 *     credentials. `origin: "*"` with credentials is NOT flagged: browsers
 *     refuse that combination outright, so it fails safe.
 *   - express-cookie-insecure: `res.cookie(name, value, options)` for a
 *     cookie named like a session/auth/token cookie, with no options or
 *     options that don't set `httpOnly: true`. An options object held in a
 *     variable isn't flagged (it can't be read from here).
 *
 * Limitations (disclosed on every finding):
 *   - Name-based: `req`/`request`/`ctx` are assumed to be the request, `res`/
 *     `response` the response, `fs` the file system module. Renamed imports
 *     and differently-named parameters are missed.
 *   - One variable hop, no cross-function tracking: input passed through a
 *     helper function first is not followed.
 *   - It can't see validation: an allowlist check or a `startsWith("/")`
 *     guard elsewhere in the handler doesn't suppress the finding. Escaping
 *     functions (`escapeHtml(...)`, `path.basename(...)`, `encodeURIComponent(...)`)
 *     DO stop it, because only known text-preserving calls are followed.
 */

const RESPONSE_NAMES = new Set(["res", "response"]);

/** `res`, or a chain rooted at it: `res.status(400)`, `res.status(200).type("html")`. */
function isResponseObject(node: t.Node, depth = 0): boolean {
    if (depth > 6) return false;
    if (t.isIdentifier(node)) return RESPONSE_NAMES.has(node.name);
    if (t.isCallExpression(node) && t.isMemberExpression(node.callee)) return isResponseObject(node.callee.object, depth + 1);
    return false;
}

/** The leftmost fixed text of a `+` chain or template literal, if any. */
function leadingLiteral(node: t.Node): string | null {
    if (t.isStringLiteral(node)) return node.value;
    if (t.isTemplateLiteral(node)) return node.quasis[0]?.value.cooked ?? null;
    if (t.isBinaryExpression(node) && node.operator === "+") return t.isExpression(node.left) ? leadingLiteral(node.left) : null;
    return null;
}

function isStringBuilding(node: t.Node): boolean {
    return (t.isBinaryExpression(node) && node.operator === "+") || (t.isTemplateLiteral(node) && node.expressions.length > 0);
}

/** True for text that visibly contains markup somewhere in its fixed parts. */
function containsMarkupLiteral(node: t.Node): boolean {
    if (t.isStringLiteral(node)) return node.value.includes("<");
    if (t.isTemplateLiteral(node)) return node.quasis.some((q) => (q.value.cooked ?? "").includes("<"));
    if (t.isBinaryExpression(node) && node.operator === "+") {
        return (t.isExpression(node.left) && containsMarkupLiteral(node.left)) || containsMarkupLiteral(node.right);
    }
    return false;
}

/** `req.body` / `req.query` as a whole (sent as JSON by res.send), as opposed to one field of it. */
function isWholeRequestContainer(node: t.Node): boolean {
    return (
        t.isMemberExpression(node) &&
        !node.computed &&
        t.isIdentifier(node.object) &&
        (node.object.name === "req" || node.object.name === "request") &&
        t.isIdentifier(node.property) &&
        ["body", "query", "params", "headers", "cookies"].includes(node.property.name)
    );
}

function requestInput(path: NodePath, node: t.Node): UserInputSource | null {
    const s = findUserInput(path, node);
    return s && s.kind === "request" ? s : null;
}

const FS_METHODS = new Set([
    "readFile", "readFileSync", "createReadStream", "writeFile", "writeFileSync", "appendFile", "appendFileSync",
    "createWriteStream", "unlink", "unlinkSync", "rm", "rmSync", "readdir", "readdirSync",
]);

/** `fs.readFile(...)`, `fs.promises.readFile(...)`, `fsp.readFile(...)`, or a bare destructured `readFile(...)`. */
function isFsCall(callee: t.Node): boolean {
    if (t.isIdentifier(callee)) return FS_METHODS.has(callee.name);
    if (!t.isMemberExpression(callee) || callee.computed || !t.isIdentifier(callee.property) || !FS_METHODS.has(callee.property.name)) return false;
    const obj = callee.object;
    if (t.isIdentifier(obj)) return obj.name === "fs" || obj.name === "fsp" || obj.name === "fsPromises";
    return t.isMemberExpression(obj) && t.isIdentifier(obj.object) && obj.object.name === "fs" && t.isIdentifier(obj.property) && obj.property.name === "promises";
}

const HTTP_CLIENT_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "request"]);

/** The URL argument of an outgoing-request call, or null if this isn't one. */
function outgoingRequestUrl(node: t.CallExpression): t.Node | null {
    const callee = node.callee;
    const first = node.arguments[0];
    if (!first || !t.isExpression(first)) return null;
    const urlOf = (arg: t.Expression): t.Node | null => {
        if (!t.isObjectExpression(arg)) return arg;
        const prop = arg.properties.find((p) => t.isObjectProperty(p) && !p.computed && t.isIdentifier(p.key) && (p.key.name === "url" || p.key.name === "uri"));
        return prop && t.isObjectProperty(prop) && t.isExpression(prop.value) ? prop.value : null;
    };
    if (t.isIdentifier(callee)) {
        // axios(...), got(...), and the global server-side fetch
        if (callee.name === "axios" || callee.name === "got" || callee.name === "fetch") return urlOf(first);
        return null;
    }
    if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property) && t.isIdentifier(callee.object)) {
        const obj = callee.object.name;
        const method = callee.property.name;
        if ((obj === "axios" || obj === "got") && HTTP_CLIENT_METHODS.has(method)) return urlOf(first);
        if ((obj === "http" || obj === "https") && (method === "get" || method === "request")) return urlOf(first);
    }
    return null;
}

const FIXED_HOST = /^https?:\/\/[^/?#]+[/?#]/i;
const SESSION_COOKIE_NAME = /(^|[^a-z])(session|sess|sid|token|auth|jwt|remember|login|refresh|connect\.sid)([^a-z]|$)|session|token/i;

function objectProp(obj: t.ObjectExpression, key: string): t.Node | undefined {
    const p = obj.properties.find((q) => t.isObjectProperty(q) && !q.computed && ((t.isIdentifier(q.key) && q.key.name === key) || (t.isStringLiteral(q.key) && q.key.value === key)));
    return p && t.isObjectProperty(p) ? p.value : undefined;
}
const isTrue = (n: t.Node | undefined) => !!n && t.isBooleanLiteral(n) && n.value === true;
const SAME_SITE_PATH = /^\/[^/\\]/;

interface Check {
    ruleId: string;
    title: string;
    severity: Severity;
    message: (src: UserInputSource) => string;
    whyItMatters: string;
    saferExample: string;
}

const CHECKS: Record<string, Check> = {
    "express-reflected-xss": {
        ruleId: "express-reflected-xss",
        title: "Request input sent back as HTML",
        severity: "high",
        message: (s) => `Text built from ${s.label} is sent straight back in the response. Express sends strings as HTML, so whatever the visitor put in the request is rendered as markup.`,
        whyItMatters:
            "Anyone can craft a link with a <script> tag in the query string. When someone opens it, your server echoes the script back into the page and it runs as your site (reflected XSS): it can read their session, act as them, or rewrite the page.",
        saferExample:
            "Escape before sending (`res.send(\"<h1>Hi \" + escapeHtml(req.query.name) + \"</h1>\")`, e.g. with the `escape-html` package), render through a template engine that escapes by default, or send JSON with `res.json(...)`.",
    },
    "express-open-redirect": {
        ruleId: "express-open-redirect",
        title: "Redirect to an address taken from the request",
        severity: "medium",
        message: (s) => `res.redirect(...) sends the visitor to an address taken from ${s.label}.`,
        whyItMatters:
            "A link to your own site can bounce people anywhere: /login?next=https://evil.example looks trustworthy because it starts with your domain. That's a staple of phishing, and if the target can be a javascript: URL it can be worse.",
        saferExample:
            "Only redirect to paths you expect: check the value against an allowlist, or require it to start with a single \"/\" followed by a path character (reject \"//\" and \"/\\\\\"), and fall back to \"/\" otherwise.",
    },
    "express-path-traversal": {
        ruleId: "express-path-traversal",
        title: "File path built from the request",
        severity: "high",
        message: (s) => `A file path that includes ${s.label} is used to read, send, write or delete a file.`,
        whyItMatters:
            "A request like ?file=../../.env walks out of the folder you meant and reaches any file the server can read: config, keys, source code. For write or delete calls, it can change or remove them.",
        saferExample:
            "Use `res.sendFile(name, { root: uploadsDir })` (Express then refuses paths outside that folder), or reduce the input to a bare file name with `path.basename(name)` and check it against the files you expect.",
    },
    "express-cors-any-origin-with-credentials": {
        ruleId: "express-cors-any-origin-with-credentials",
        title: "CORS accepts any site, with cookies",
        severity: "medium",
        message: () => "CORS is set to accept requests from any website while also allowing credentials (cookies, auth headers).",
        whyItMatters:
            "Any site a logged-in user visits can call your API as that user and read the responses: their profile, their data, anything the API returns. The browser sends their cookies along because you told it to.",
        saferExample:
            "List the sites you trust: `cors({ origin: [\"https://yourapp.com\"], credentials: true })`. If you don't need cookies across sites, drop `credentials: true`.",
    },
    "express-cookie-insecure": {
        ruleId: "express-cookie-insecure",
        title: "Session cookie readable by JavaScript",
        severity: "medium",
        message: () => "A session/auth cookie is set without `httpOnly: true`, so any script running on the page can read it.",
        whyItMatters:
            "If any XSS bug ever gets in (yours or a third-party script's), it can read this cookie and send it off. With the session token in hand, an attacker is logged in as that user, no password needed.",
        saferExample:
            "`res.cookie(\"session\", token, { httpOnly: true, secure: true, sameSite: \"lax\", maxAge: 7 * 24 * 3600 * 1000 })`.",
    },
    "express-ssrf": {
        ruleId: "express-ssrf",
        title: "Server fetches an address taken from the request",
        severity: "high",
        message: (s) => `The server makes an outgoing request to an address taken from ${s.label}.`,
        whyItMatters:
            "This lets anyone make your server request any address for them (server-side request forgery), including internal ones it can reach and they can't: admin panels, databases, or cloud metadata endpoints that hand out credentials.",
        saferExample:
            "Don't let the request choose the host. Keep a fixed base URL and only let the request pick an id or path segment, or check the parsed host against an allowlist before making the call.",
    },
};

const LIMITATIONS =
    "Name-based: assumes `req`/`request`/`ctx` is the incoming request, `res`/`response` the response and `fs` the file system module, so renamed variables or imports are missed. Follows one variable back and doesn't cross into other functions. It can't see validation done elsewhere (an allowlist check, a prefix guard), so a value that is actually checked can still be flagged. Escaping calls like escapeHtml(), path.basename() or encodeURIComponent() do stop it.";

const CONFIG_LIMITATIONS =
    "Reads the settings written at this call only. An options object built elsewhere or held in a variable isn't checked, and a session cookie or CORS setup under an unusual name is missed. For CORS, a custom origin function is not evaluated.";

function makeConfigFinding(check: Check, node: t.Node, code: string): Finding {
    return {
        ruleId: check.ruleId,
        title: check.title,
        severity: check.severity,
        category: "express-request",
        message: check.message({ kind: "request", label: "" }),
        whyItMatters: check.whyItMatters,
        saferExample: check.saferExample,
        limitations: CONFIG_LIMITATIONS,
        location: locOf(node),
        snippet: excerptOf(code, node),
    };
}

function makeFinding(check: Check, node: t.Node, code: string, source: UserInputSource): Finding {
    return {
        ruleId: check.ruleId,
        title: check.title,
        severity: check.severity,
        category: "express-request",
        message: check.message(source),
        whyItMatters: check.whyItMatters,
        saferExample: check.saferExample,
        limitations: LIMITATIONS,
        location: locOf(node),
        snippet: excerptOf(code, node),
    };
}

export const expressRequestRule: Rule = {
    id: "express-request",
    category: "express-request",
    title: "Request input reaching a dangerous server call",
    run(ctx: RuleContext): Finding[] {
        const findings: Finding[] = [];
        const { ast, code } = ctx;

        traverseAst(ast, {
            CallExpression(path) {
                const { node } = path;
                const callee = node.callee;
                const args = node.arguments.filter((a): a is t.Expression => t.isExpression(a));

                // cors({ origin: true, credentials: true })
                if (t.isIdentifier(callee) && callee.name === "cors" && args[0] && t.isObjectExpression(args[0])) {
                    if (isTrue(objectProp(args[0], "origin")) && isTrue(objectProp(args[0], "credentials"))) {
                        findings.push(makeConfigFinding(CHECKS["express-cors-any-origin-with-credentials"], node, code));
                    }
                    return;
                }

                if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property) && isResponseObject(callee.object)) {
                    const method = callee.property.name;

                    // Manual CORS: echoing the request's Origin back, with credentials allowed somewhere in the file.
                    if ((method === "setHeader" || method === "header" || method === "set") && args.length >= 2 && t.isStringLiteral(args[0])
                        && args[0].value.toLowerCase() === "access-control-allow-origin" && /access-control-allow-credentials/i.test(code)) {
                        if (requestInput(path, args[1])) findings.push(makeConfigFinding(CHECKS["express-cors-any-origin-with-credentials"], node, code));
                        return;
                    }

                    // res.cookie("session", value, { ... }) without httpOnly
                    if (method === "cookie" && args[0] && t.isStringLiteral(args[0]) && SESSION_COOKIE_NAME.test(args[0].value)) {
                        const opts = args[2];
                        if (opts && !t.isObjectExpression(opts)) return;
                        if (opts && isTrue(objectProp(opts, "httpOnly"))) return;
                        findings.push(makeConfigFinding(CHECKS["express-cookie-insecure"], node, code));
                        return;
                    }

                    if (method === "send" && args[0]) {
                        const body = args[0];
                        if (isWholeRequestContainer(body) || t.isObjectExpression(body) || t.isArrayExpression(body)) return;
                        const src = requestInput(path, body);
                        if (src) findings.push(makeFinding(CHECKS["express-reflected-xss"], node, code, src));
                        return;
                    }
                    if ((method === "write" || method === "end") && args[0] && isStringBuilding(args[0]) && containsMarkupLiteral(args[0])) {
                        const src = requestInput(path, args[0]);
                        if (src) findings.push(makeFinding(CHECKS["express-reflected-xss"], node, code, src));
                        return;
                    }
                    if (method === "redirect" && args.length > 0) {
                        const target = args[args.length - 1];
                        const lead = leadingLiteral(target);
                        if (lead !== null && SAME_SITE_PATH.test(lead)) return;
                        const src = requestInput(path, target);
                        if (src) findings.push(makeFinding(CHECKS["express-open-redirect"], node, code, src));
                        return;
                    }
                    if ((method === "sendFile" || method === "download") && args[0]) {
                        const opts = args.find((a, i) => i > 0 && t.isObjectExpression(a)) as t.ObjectExpression | undefined;
                        const hasRoot = opts?.properties.some((p) => t.isObjectProperty(p) && !p.computed && t.isIdentifier(p.key) && p.key.name === "root");
                        if (method === "sendFile" && hasRoot) return;
                        const src = requestInput(path, args[0]);
                        if (src) findings.push(makeFinding(CHECKS["express-path-traversal"], node, code, src));
                        return;
                    }
                }

                if (isFsCall(callee) && args[0] && !isStaticStringExpression(args[0])) {
                    const src = requestInput(path, args[0]);
                    if (src) findings.push(makeFinding(CHECKS["express-path-traversal"], node, code, src));
                    return;
                }

                const url = outgoingRequestUrl(node);
                if (url && !isStaticStringExpression(url)) {
                    const lead = leadingLiteral(url);
                    if (lead !== null && FIXED_HOST.test(lead)) return;
                    const src = requestInput(path, url);
                    if (src) findings.push(makeFinding(CHECKS["express-ssrf"], node, code, src));
                }
            },
        });

        return findings;
    },
};
