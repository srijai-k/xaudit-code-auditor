import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { traverseAst, locOf, excerptOf, findUserInput, isStaticStringExpression, wordsOf, type UserInputSource } from "../ast-utils";
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
 *   - Up to three variable hops within one function (REQUEST_HOPS), no
 *     cross-function tracking: input passed through a helper function first
 *     is not followed.
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

/**
 * How many never-reassigned variables to follow back from the call. Route
 * handlers routinely stage input through a couple of them
 * (`const name = String(req.query.file); const full = path.join(dir, name);
 * res.sendFile(full)`), and every check here already requires the trail to
 * end at the request, so following further doesn't add false alarms the way
 * it would for a sink-shape-only rule.
 */
const REQUEST_HOPS = 3;

function requestInput(path: NodePath, node: t.Node): UserInputSource | null {
    const s = findUserInput(path, node, REQUEST_HOPS);
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
    "express-secret-in-response": {
        ruleId: "express-secret-in-response",
        title: "Secret or password sent in a response",
        severity: "high",
        message: () => "The response includes a field named like a password, secret or private token.",
        whyItMatters:
            "Anything in a response can be read by whoever made the request, and often ends up in logs, browser history and caches too. A password, a signing secret or a reset token there hands over exactly what it was meant to protect.",
        saferExample:
            "Pick the fields you mean to send: `res.json({ id: user.id, email: user.email, role: user.role })`. Send reset tokens by email only. Never return secrets or config like the JWT secret from an endpoint.",
    },
    "express-client-controlled-ownership": {
        ruleId: "express-client-controlled-ownership",
        title: "Owner or role taken from the request",
        severity: "high",
        message: () => "A field that decides who owns this record or what they're allowed to do is set from the request.",
        whyItMatters:
            "The client can send any value it likes. If the owner id, user id or role comes from req.body, anyone can create records in someone else's name, move a record to their own account, or give themselves a higher role.",
        saferExample:
            "Set ownership from the logged-in user, never from the request: `ownerId: req.user.id`. Copy only the fields a user may edit (`document.content = req.body.content`) instead of spreading or assigning all of req.body.",
    },
    "express-admin-route-without-role-check": {
        ruleId: "express-admin-route-without-role-check",
        title: "Admin route with no admin check",
        severity: "high",
        message: () => "This is an /admin route, but nothing in it checks that the caller is an admin: no admin or role middleware on the route, and no role check in the handler.",
        whyItMatters:
            "Being logged in isn't the same as being an admin. Without a role check, any signed-in user who finds this URL can do whatever it does, like promoting themselves to admin or deleting other accounts.",
        saferExample:
            "Add the same guard the other admin routes use: `app.post(\"/admin/promote\", authenticated, adminOnly, handler)`, or mount every admin route behind it at once with `app.use(\"/admin\", authenticated, adminOnly)`.",
    },
    "express-missing-ownership-check": {
        ruleId: "express-missing-ownership-check",
        title: "Record loaded by id with no check on who's asking",
        severity: "medium",
        message: () => "This route needs a login, then loads a record using an id from the request, but never looks at who is logged in (req.user, req.auth, req.session).",
        whyItMatters:
            "Any signed-in user can change the id in the URL and get, or change, someone else's record: their documents, their account, their orders. This is the most common access-control bug in real APIs (often called IDOR or broken object-level authorization).",
        saferExample:
            "Check the record belongs to the caller before using it: `if (doc.ownerId !== req.auth.userId) return res.status(404).end()`, or look it up by both: `documents.find((d) => d.id === id && d.ownerId === req.auth.userId)`.",
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
    "Name-based: assumes `req`/`request`/`ctx` is the incoming request, `res`/`response` the response and `fs` the file system module, so renamed variables or imports are missed. Follows up to three variables back within the same function and doesn't cross into other functions. It can't see validation done elsewhere (an allowlist check, a prefix guard), so a value that is actually checked can still be flagged. Escaping calls like escapeHtml(), path.basename() or encodeURIComponent() do stop it.";

const CONFIG_LIMITATIONS =
    "Reads the settings written at this call only. An options object built elsewhere or held in a variable isn't checked, and a session cookie or CORS setup under an unusual name is missed. For CORS, a custom origin function is not evaluated.";

// ---- access control: responses, ownership fields, routes -----------------

function memberPropOf(node: t.Node): string {
    return t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property) ? node.property.name : "";
}

const SENSITIVE_WORDS = new Set(["password", "passwd", "passphrase", "secret", "privatekey", "apikey", "pwd"]);
const SENSITIVE_PAIRS: [string, Set<string>][] = [
    ["private", new Set(["key"])],
    ["api", new Set(["key", "token", "secret"])],
    ["internal", new Set(["token", "key", "secret"])],
    ["reset", new Set(["token", "code", "link"])],
    ["verification", new Set(["token", "code"])],
    ["access", new Set(["key"])],
    ["client", new Set(["secret"])],
    ["service", new Set(["token", "key"])],
];
/** Whole-word: "password", "jwtSecret", "apiToken", "resetToken" - but not "token" (a login response) or "accessToken". */
function isSensitiveKey(key: string): boolean {
    const words = wordsOf(key);
    if (words.some((w) => SENSITIVE_WORDS.has(w))) return true;
    return words.some((w, i) => SENSITIVE_PAIRS.some(([first, seconds]) => w === first && seconds.has(words[i + 1] ?? "")));
}

/** Sensitive keys in a response object literal, one level of nesting deep. */
function sensitiveKeysIn(obj: t.ObjectExpression, depth = 0): string[] {
    const out: string[] = [];
    for (const p of obj.properties) {
        if (!t.isObjectProperty(p) || p.computed) continue;
        const key = t.isIdentifier(p.key) ? p.key.name : t.isStringLiteral(p.key) ? p.key.value : undefined;
        if (!key) continue;
        const v = p.value;
        const harmless = t.isNullLiteral(v) || (t.isIdentifier(v) && v.name === "undefined") || t.isBooleanLiteral(v);
        if (isSensitiveKey(key) && !harmless) out.push(key);
        else if (depth < 1 && t.isObjectExpression(v)) out.push(...sensitiveKeysIn(v, depth + 1));
    }
    return out;
}

const OWNERSHIP_WORDS = new Set(["owner", "role", "roles", "admin", "permissions", "permission", "privileges", "scopes"]);
/** ownerId, owner, userId, user_id, createdBy, role, isAdmin, permissions... */
function isOwnershipKey(key: string): boolean {
    const words = wordsOf(key);
    if (words.some((w) => OWNERSHIP_WORDS.has(w))) return true;
    const joined = words.join("");
    return joined === "userid" || joined === "createdby" || joined === "authorid" || joined === "accountid" || joined === "tenantid";
}

function ownershipFinding(key: string, node: t.Node, code: string): Finding {
    return {
        ...makeConfigFinding(CHECKS["express-client-controlled-ownership"], node, code),
        message: `"${key}" is set from the request. It decides who owns this record or what they can do, so the client shouldn't get to choose it.`,
    };
}

interface Route {
    path: string;
    middleware: t.Node[];
    handler: t.ArrowFunctionExpression | t.FunctionExpression;
    reqName: string;
}

const ROUTE_METHODS = new Set(["get", "post", "put", "patch", "delete", "del", "all"]);
const ROUTER_NAMES = /^(app|router|api|routes|server|admin\w*|\w*Router)$/;

/** `app.get("/path", ...middleware, handler)` with an inline handler. */
function routeOf(node: t.CallExpression): Route | null {
    const c = node.callee;
    if (!t.isMemberExpression(c) || c.computed || !t.isIdentifier(c.property) || !ROUTE_METHODS.has(c.property.name)) return null;
    if (!t.isIdentifier(c.object) || !ROUTER_NAMES.test(c.object.name)) return null;
    const [first, ...rest] = node.arguments;
    if (!first || !t.isStringLiteral(first) || !first.value.startsWith("/")) return null;
    const handler = rest[rest.length - 1];
    if (!handler || !(t.isArrowFunctionExpression(handler) || t.isFunctionExpression(handler))) return null;
    const reqParam = handler.params[0];
    return {
        path: first.value,
        middleware: rest.slice(0, -1) as t.Node[],
        handler,
        reqName: t.isIdentifier(reqParam) ? reqParam.name : "req",
    };
}

const middlewareName = (n: t.Node): string =>
    t.isIdentifier(n) ? n.name
        : t.isCallExpression(n) ? middlewareName(n.callee)
            : t.isMemberExpression(n) && !n.computed && t.isIdentifier(n.property) ? `${middlewareName(n.object)}.${n.property.name}` : "";
const ROLE_MIDDLEWARE = /admin|role|permission|authori[sz]|acl|scope|can[A-Z_]|isAllowed|staff|superuser/i;
const AUTH_MIDDLEWARE = /auth|login|logged|session|passport|jwt|protect|require|ensure|verify|token|signedIn/i;
const CURRENT_USER_PROPS = new Set(["user", "auth", "session", "currentUser", "account", "userId", "identity", "claims"]);
const ROLE_PROPS = /^(role|roles|isAdmin|admin|permissions|permission|scopes|isStaff|isSuperuser)$/;

/** Walk a function body without going into nested functions' own bodies. */
function walk(root: t.Node, visit: (n: t.Node) => void): void {
    const go = (n: t.Node | null | undefined, depth: number) => {
        if (!n || depth > 60) return;
        visit(n);
        for (const key of t.VISITOR_KEYS[n.type] ?? []) {
            const child = (n as unknown as Record<string, unknown>)[key];
            if (Array.isArray(child)) child.forEach((ch) => go(ch as t.Node, depth + 1));
            else if (child && typeof child === "object" && "type" in (child as object)) go(child as t.Node, depth + 1);
        }
    };
    go(root, 0);
}

/** `req.user`, `req.auth.userId`, `req.session`, `res.locals.user`, `ctx.state.user`. */
function readsCurrentUser(route: Route): boolean {
    let found = false;
    walk(route.handler.body, (n) => {
        if (found || !t.isMemberExpression(n) || n.computed || !t.isIdentifier(n.property)) return;
        const obj = n.object;
        if (t.isIdentifier(obj) && obj.name === route.reqName && CURRENT_USER_PROPS.has(n.property.name)) found = true;
        if (t.isMemberExpression(obj) && !obj.computed && t.isIdentifier(obj.object) && t.isIdentifier(obj.property)
            && ((obj.object.name === "res" && obj.property.name === "locals") || (obj.object.name === "ctx" && obj.property.name === "state"))) found = true;
    });
    return found;
}

/** A role read off the CALLER (req.user.role, req.auth.isAdmin) anywhere in a condition. */
function checksCallerRole(route: Route): boolean {
    let found = false;
    walk(route.handler.body, (n) => {
        if (found) return;
        const test = t.isIfStatement(n) || t.isConditionalExpression(n) ? n.test : t.isBinaryExpression(n) || t.isLogicalExpression(n) ? n : null;
        if (!test) return;
        walk(test, (m) => {
            if (found || !t.isMemberExpression(m) || m.computed || !t.isIdentifier(m.property) || !ROLE_PROPS.test(m.property.name)) return;
            let root: t.Node = m.object;
            while (t.isMemberExpression(root)) root = root.object;
            if (t.isIdentifier(root) && root.name === route.reqName) found = true;
        });
    });
    return found;
}

const LOOKUP_METHODS = new Set(["find", "findOne", "findById", "findByPk", "findUnique", "findFirst", "findIndex", "filter", "get", "where", "query", "findOneAndUpdate", "findByIdAndUpdate", "findByIdAndDelete", "deleteOne", "updateOne", "destroy", "update"]);

/** A lookup call whose arguments use an id taken from the request (req.params.*, or an *id field of req.body/req.query). */
function looksUpByRequestId(route: Route): boolean {
    let found = false;
    const usesRequestId = (n: t.Node) => {
        let hit = false;
        walk(n, (m) => {
            if (hit || !t.isMemberExpression(m) || m.computed || !t.isIdentifier(m.property)) return;
            const obj = m.object;
            if (t.isIdentifier(obj) && obj.name === route.reqName && m.property.name === "params") hit = true;
            if (t.isMemberExpression(obj) && !obj.computed && t.isIdentifier(obj.object) && obj.object.name === route.reqName
                && t.isIdentifier(obj.property) && /^(body|query|params)$/.test(obj.property.name) && /(^id$|Id$|_id$)/.test(m.property.name)) hit = true;
        });
        return hit;
    };
    walk(route.handler.body, (n) => {
        if (found || !t.isCallExpression(n)) return;
        const c = n.callee;
        const name = t.isMemberExpression(c) && !c.computed && t.isIdentifier(c.property) ? c.property.name : t.isIdentifier(c) ? c.name : "";
        if (!LOOKUP_METHODS.has(name)) return;
        // Arguments, including callbacks like (item) => item.id === Number(req.params.id).
        if (n.arguments.some((a) => usesRequestId(a))) found = true;
    });
    return found;
}

/** Guards mounted with `app.use(...)`: on a path prefix, or on the whole app when there's no path. */
interface MountedGuard {
    prefix: string; // "" = every route
    role: boolean;
    auth: boolean;
}

function mountedGuards(ast: t.File): MountedGuard[] {
    const guards: MountedGuard[] = [];
    traverseAst(ast, {
        CallExpression(path) {
            const c = path.node.callee;
            if (!t.isMemberExpression(c) || c.computed || !t.isIdentifier(c.property) || c.property.name !== "use") return;
            if (!t.isIdentifier(c.object) || !ROUTER_NAMES.test(c.object.name)) return;
            const [first, ...rest] = path.node.arguments;
            const hasPrefix = !!first && t.isStringLiteral(first);
            const mws = (hasPrefix ? rest : path.node.arguments).map((a) => middlewareName(a as t.Node));
            const role = mws.some((n) => ROLE_MIDDLEWARE.test(n));
            const auth = role || mws.some((n) => AUTH_MIDDLEWARE.test(n));
            if (role || auth) guards.push({ prefix: hasPrefix ? (first as t.StringLiteral).value.replace(/\/$/, "") : "", role, auth });
        },
    });
    return guards;
}

const coveredBy = (routePath: string, g: MountedGuard) => g.prefix === "" || routePath === g.prefix || routePath.startsWith(g.prefix + "/");

function checkRoute(route: Route, node: t.Node, code: string, guards: MountedGuard[]): Finding[] {
    const names = route.middleware.map(middlewareName);
    const mounted = guards.filter((g) => coveredBy(route.path, g));
    const hasRoleMiddleware = names.some((n) => ROLE_MIDDLEWARE.test(n)) || mounted.some((g) => g.role);
    const hasAuthMiddleware = names.some((n) => AUTH_MIDDLEWARE.test(n)) || mounted.some((g) => g.auth);
    const isAdminPath = /(^|\/)admin(\/|$)/i.test(route.path);

    if (isAdminPath) {
        if (hasRoleMiddleware || checksCallerRole(route)) return [];
        return [{
            ...makeConfigFinding(CHECKS["express-admin-route-without-role-check"], node, code),
            message: `${route.path} is an admin route, but nothing in it checks that the caller is an admin: no admin or role middleware on the route${hasAuthMiddleware ? " (only a login check)" : ""}, and no role check in the handler.`,
        }];
    }
    if (hasAuthMiddleware && !hasRoleMiddleware && looksUpByRequestId(route) && !readsCurrentUser(route)) {
        return [{
            ...makeConfigFinding(CHECKS["express-missing-ownership-check"], node, code),
            message: `${route.path} needs a login, then loads a record using an id from the request, but never looks at who is logged in (req.user, req.auth, req.session). Any signed-in user can try other ids.`,
            limitations: "A heuristic: whether a user should see a record depends on what the app is for, which no pattern can know. It fires on a route with login-style middleware that looks a record up by an id from the request and never reads the current user. A check done inside a helper function, a database query scoped some other way, or a route that's meant to be public to all users will still be flagged; a route with no recognisable login middleware isn't checked at all.",
        }];
    }
    return [];
}

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
        const guards = mountedGuards(ast);

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

                // app.get("/admin/x", mw, handler) etc: access-control checks on the route as a whole.
                const route = routeOf(node);
                if (route) {
                    for (const f of checkRoute(route, node, code, guards)) findings.push(f);
                }

                // Object.assign(record, req.body): every field the client sends, owner and role included.
                if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.object) && callee.object.name === "Object"
                    && t.isIdentifier(callee.property) && callee.property.name === "assign" && args.length >= 2) {
                    if (args.slice(1).some((a) => isWholeRequestContainer(a) && /body|query/.test(memberPropOf(a)))) {
                        findings.push(makeConfigFinding(CHECKS["express-client-controlled-ownership"], node, code));
                    }
                }

                if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property) && isResponseObject(callee.object)) {
                    const method = callee.property.name;

                    // res.json({ password: ... }) / res.send({ jwtSecret: ... })
                    if ((method === "json" || method === "send" || method === "jsonp") && args[0] && t.isObjectExpression(args[0])) {
                        const leaked = sensitiveKeysIn(args[0]);
                        if (leaked.length) {
                            findings.push({
                                ...makeConfigFinding(CHECKS["express-secret-in-response"], node, code),
                                message: `The response includes ${leaked.map((k) => `"${k}"`).join(", ")}. Whoever makes this request gets ${leaked.length === 1 ? "that value" : "those values"} back.`,
                            });
                        }
                        if (method !== "send") return;
                    }

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

            // record.ownerId = req.body.ownerId / record.role = req.body.role
            AssignmentExpression(path) {
                const { node } = path;
                if (node.operator !== "=" && node.operator !== "??=" && node.operator !== "||=") return;
                const key = t.isMemberExpression(node.left) && !node.left.computed && t.isIdentifier(node.left.property) ? node.left.property.name : undefined;
                if (key && isOwnershipKey(key) && requestInput(path, node.right)) {
                    findings.push(ownershipFinding(key, node, code));
                }
            },

            // { ownerId: req.body.ownerId, ... } / { ...req.body }
            ObjectExpression(path) {
                const { node } = path;
                for (const p of node.properties) {
                    if (t.isSpreadElement(p) && isWholeRequestContainer(p.argument) && /body|query/.test(memberPropOf(p.argument))) {
                        findings.push(makeConfigFinding(CHECKS["express-client-controlled-ownership"], p, code));
                        continue;
                    }
                    if (!t.isObjectProperty(p) || p.computed) continue;
                    const key = t.isIdentifier(p.key) ? p.key.name : t.isStringLiteral(p.key) ? p.key.value : undefined;
                    if (key && isOwnershipKey(key) && t.isExpression(p.value) && requestInput(path, p.value)) {
                        findings.push(ownershipFinding(key, p, code));
                    }
                }
            },
        });

        return findings;
    },
};
