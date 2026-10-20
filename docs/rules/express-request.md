# Request input reaching a dangerous server call — `express-request.ts`

Source: [`src/lib/analysis/rules/express-request.ts`](../../src/lib/analysis/rules/express-request.ts) · Tests: [`tests/rules/express-request.test.ts`](../../tests/rules/express-request.test.ts) · Category: `express-request`

Narrow checks for Express/Koa-style Node.js handlers. The first four need the same thing before they fire: a value that visibly comes from the incoming request reaching the call. "The request" means `req.query`, `req.body`, `req.params`, `req.headers`, `req.cookies`, `req.get(...)`/`req.header(...)`, or Koa's `ctx.query`/`ctx.params`/`ctx.request.body`.

The input is followed directly, through string building (`+`, template literals), through text-preserving calls (`.trim()`, `.slice()`, `decodeURIComponent()`, `path.join()`), and one never-reassigned variable back, including destructuring (`const { name } = req.query`). Any other function call is treated as opaque on purpose, so `escapeHtml(req.query.name)` or `path.basename(req.params.file)` stops the finding.

A dynamic value from anywhere else is **not** flagged by this module. "Any non-literal reaching `res.redirect`" would fire on nearly every real redirect, the same over-breadth mistake the reverted `import()`/`require()` check made (see [`docs/model-improvements.md`](../model-improvements.md)).

The last two (`express-cors-any-origin-with-credentials`, `express-cookie-insecure`) are configuration checks: the risky thing is the setting itself, so they don't need request input.

**Shared limitations:** name-based. `req`/`request`/`ctx` are assumed to be the request, `res`/`response` the response and `fs` the file system module, so renamed variables or imports are missed. One variable hop, no cross-function tracking: input passed into a helper function first is not followed (a documented false negative, `tests/fixtures/edge-cases/express-input-through-helper-not-caught.ts`). It can't see validation done elsewhere in the handler (an allowlist check, a prefix guard), so a value that really is checked can still be flagged.

---

## express-reflected-xss

**What it flags:** request input built into a string passed to `res.send(...)`, including chained calls like `res.status(200).send(...)`. Express sends strings as `text/html`. Also flags `res.write(...)`/`res.end(...)` when the string visibly contains markup (a `<` in its fixed text).

**Severity:** High. Anyone can send someone a link with a `<script>` in the query string, and the server echoes it into the page as the site.

**Risky example:**
```js
app.get("/hello", (req, res) => {
  res.send("<h1>Hello " + req.query.name + "</h1>");
});
```

**Safe example (not flagged):**
```js
app.get("/hello", (req, res) => {
  res.send("<h1>Hello " + escapeHtml(req.query.name) + "</h1>");
});
```
`escapeHtml` isn't a known pass-through, so the input stops there. Whole request objects (`res.send(req.body)`) are also skipped: Express sends objects as JSON.

**Limitations:** see shared limitations above. A template engine (`res.render`) is not checked. Escaping is recognised only by the input passing through *some* call that isn't a known pass-through, not by checking that the call actually escapes.

**Tests:** `tests/fixtures/vulnerable/express-reflected-xss-query.ts`, `express-reflected-xss-destructured-template.ts` · safe: `tests/fixtures/safe/express-send-escaped-safe.ts`, `express-send-request-object-as-json-safe.ts` · edge: `tests/fixtures/edge-cases/express-input-through-helper-not-caught.ts`

---

## express-open-redirect

**What it flags:** request input as the target of `res.redirect(...)` (the last argument, so `res.redirect(301, url)` is covered), unless the string starts with a fixed same-site path like `"/users/"`.

**Severity:** Medium. On its own it's a phishing tool (a link to your site that lands somewhere else), not code execution.

**Risky example:**
```js
app.post("/login", async (req, res) => {
  await signIn(req.body.email, req.body.password);
  res.redirect(req.query.next);
});
```
A leading `"/"` alone is not treated as safe: `"/" + "/evil.example"` is the protocol-relative URL `//evil.example` (`tests/fixtures/vulnerable/express-open-redirect-leading-slash-only.ts`).

**Safe example (not flagged):**
```js
res.redirect("/users/" + req.params.id);
```

**Limitations:** see shared limitations above. An allowlist check before the redirect doesn't suppress the finding.

**Tests:** `tests/fixtures/vulnerable/express-open-redirect-next-param.ts`, `express-open-redirect-leading-slash-only.ts` · safe: `tests/fixtures/safe/express-redirect-same-site-path-safe.ts`

---

## express-path-traversal

**What it flags:** request input in the path given to `res.sendFile(...)`/`res.download(...)`, or to an `fs` read/write/delete call: `readFile(Sync)`, `createReadStream`, `writeFile(Sync)`, `appendFile(Sync)`, `createWriteStream`, `unlink(Sync)`, `rm(Sync)`, `readdir(Sync)`. That includes `fs.promises.*` and bare destructured names. `path.join()`/`path.resolve()` are followed, because they keep a `../` segment intact.

**Severity:** High. `?file=../../.env` reaches any file the server can read, and for write/delete calls, change or remove it.

**Risky example:**
```js
app.get("/download", (req, res) => {
  fs.readFile(path.join(uploadsDir, req.query.file), (err, data) => {
    res.send(data);
  });
});
```

**Safe examples (not flagged):**
```js
res.sendFile(req.params.name, { root: uploadsDir });              // Express refuses paths outside root
res.sendFile(path.join(uploadsDir, path.basename(req.query.file))); // basename strips any directory part
```

**Limitations:** see shared limitations above. The `{ root }` exemption only applies to `res.sendFile` with an inline options object.

**Tests:** `tests/fixtures/vulnerable/express-path-traversal-sendfile.ts`, `express-path-traversal-fs-path-join.ts` · safe: `tests/fixtures/safe/express-sendfile-root-option-safe.ts`, `express-path-basename-safe.ts`

---

## express-ssrf

**What it flags:** request input as the URL of an outgoing request the server makes: `axios(...)`, `axios.get/post/put/patch/delete/head/options/request(...)`, `got(...)`/`got.get(...)`, `http(s).get/request(...)`, or the global `fetch` used on the server. A `{ url }` / `{ uri }` options object is checked too. Not flagged when the string starts with a fixed scheme and host (`"https://api.example/v1/" + id`).

**Severity:** High. It lets anyone make the server request internal addresses it can reach and they can't, such as admin panels, databases, or cloud metadata endpoints that hand out credentials.

**Risky example:**
```js
app.get("/preview", async (req, res) => {
  const response = await axios.get(req.query.url);
  res.json({ title: extractTitle(response.data) });
});
```

**Safe example (not flagged):**
```js
await axios.get("https://api.weather.example/v1/today/" + encodeURIComponent(req.query.city));
```
Browser code requesting a URL from the page's own query string is not flagged either: that runs in the visitor's browser, so it isn't server-side request forgery (`tests/fixtures/safe/express-browser-url-not-ssrf-safe.ts`).

**Limitations:** see shared limitations above. Other HTTP clients (`superagent`, `needle`, `undici.request`) aren't recognised. A host allowlist check elsewhere doesn't suppress the finding.

**Tests:** `tests/fixtures/vulnerable/express-ssrf-axios-query-url.ts`, `express-ssrf-server-fetch-callback.ts` · safe: `tests/fixtures/safe/express-axios-fixed-host-safe.ts`, `express-browser-url-not-ssrf-safe.ts`

---

## express-cors-any-origin-with-credentials

A configuration check: it doesn't need request input, because the risky thing is the setting itself.

**What it flags:** `cors({ origin: true, credentials: true })` (the `cors` package then echoes back whatever origin a request claims), or a manual `res.setHeader/header/set("Access-Control-Allow-Origin", <request input>)` in a file that also sets `Access-Control-Allow-Credentials`.

**Severity:** Medium. Any site a logged-in user visits can call the API as them and read the answers.

**Risky example:**
```js
app.use(cors({ origin: true, credentials: true }));
```

**Safe examples (not flagged):**
```js
app.use(cors({ origin: ["https://app.example.com"], credentials: true }));
app.use(cors());
```
`origin: "*"` with credentials isn't flagged either: browsers refuse that combination, so it fails safe.

**Limitations:** reads the settings written in this call only. An options object built elsewhere, or a custom origin function, isn't evaluated.

**Tests:** `tests/fixtures/vulnerable/express-cors-origin-true-credentials.ts` · safe: `tests/fixtures/safe/express-cors-allowlist-safe.ts`

---

## express-cookie-insecure

A configuration check: it doesn't need request input.

**What it flags:** `res.cookie(name, value, options)` for a cookie whose literal name looks like a session/auth cookie (session, sess, sid, token, auth, jwt, remember, login, refresh), with no options at all or an inline options object that doesn't set `httpOnly: true`.

**Severity:** Medium. Any script on the page, including one injected through an XSS bug, can read the cookie and take over the session.

**Risky example:**
```js
res.cookie("session", token, { secure: true });
```

**Safe examples (not flagged):**
```js
res.cookie("session", token, { httpOnly: true, secure: true, sameSite: "lax" });
res.cookie("theme", "dark");
```

**Limitations:** an options object held in a variable isn't checked (not flagged). Only `httpOnly` is required; a missing `secure` or `sameSite` is mentioned in the safer example but doesn't trigger the finding on its own. Cookies named outside the list are missed.

**Tests:** `tests/fixtures/vulnerable/express-cookie-session-no-httponly.ts` · safe: `tests/fixtures/safe/express-cookie-httponly-safe.ts`
