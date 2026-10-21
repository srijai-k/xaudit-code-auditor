# Request input reaching a dangerous server call — `express-request.ts`

Source: [`src/lib/analysis/rules/express-request.ts`](../../src/lib/analysis/rules/express-request.ts) · Tests: [`tests/rules/express-request.test.ts`](../../tests/rules/express-request.test.ts) · Category: `express-request`

Narrow checks for Express/Koa-style Node.js handlers. The first four need the same thing before they fire: a value that visibly comes from the incoming request reaching the call. "The request" means `req.query`, `req.body`, `req.params`, `req.headers`, `req.cookies`, `req.get(...)`/`req.header(...)`, or Koa's `ctx.query`/`ctx.params`/`ctx.request.body`.

The input is followed directly, through string building (`+`, template literals), through text-preserving calls (`.trim()`, `.slice()`, `decodeURIComponent()`, `path.join()`), and up to three never-reassigned variables back within the same function, including destructuring (`const { name } = req.query`). Route handlers often stage input through a couple of variables first (`const name = String(req.query.file); const full = path.join(dir, name); res.sendFile(full)`), and every check needs the trail to end at the request, so following further doesn't add false alarms. Any other function call is treated as opaque on purpose, so `escapeHtml(req.query.name)` or `path.basename(req.params.file)` stops the finding.

A dynamic value from anywhere else is **not** flagged by this module. "Any non-literal reaching `res.redirect`" would fire on nearly every real redirect, the same over-breadth mistake the reverted `import()`/`require()` check made (see [`docs/model-improvements.md`](../model-improvements.md)).

The last two (`express-cors-any-origin-with-credentials`, `express-cookie-insecure`) are configuration checks: the risky thing is the setting itself, so they don't need request input.

**Shared limitations:** name-based. `req`/`request`/`ctx` are assumed to be the request, `res`/`response` the response and `fs` the file system module, so renamed variables or imports are missed. Up to three variable hops within one function, no cross-function tracking: input passed into a helper function first is not followed (a documented false negative, `tests/fixtures/edge-cases/express-input-through-helper-not-caught.ts`). It can't see validation done elsewhere in the handler (an allowlist check, a prefix guard), so a value that really is checked can still be flagged.

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


---

## express-secret-in-response

A response check: it doesn't need request input.

**What it flags:** `res.json(...)`, `res.send(...)` or `res.jsonp(...)` with an object literal that has a field named like a password, secret, private key, API key/token, internal token, reset token or verification code (whole words, one level of nesting checked).

**Severity:** High. Whoever makes the request gets the value, and responses end up in logs and caches too.

**Risky examples:**
```js
res.json({ jwtSecret: JWT_SECRET, apiToken: process.env.INTERNAL_API_TOKEN });
res.json({ id: a.id, email: a.email, password: a.password });
res.json({ message: "Reset requested", resetToken: token });
```

**Safe examples (not flagged):**
```js
res.json({ token: makeSession(), user: { id: u.id, email: u.email } }); // a login response
res.json({ accessToken, refreshToken, expiresIn: 3600 });
res.json({ passwordChanged: true });
```
A plain `token`, `accessToken` or `refreshToken` isn't flagged: returning those is what a login endpoint is for.

**Limitations:** only object literals written at the call are checked. `res.json(user)` that sends a whole database record, password field and all, isn't flagged, because the fields can't be seen from here.

**Tests:** `tests/fixtures/vulnerable/express-secret-in-response.ts`, `express-workspace-service-audit.ts` · safe: `tests/fixtures/safe/express-login-token-response-safe.ts`

---

## express-client-controlled-ownership

**What it flags:** a field that decides ownership or permissions (`ownerId`, `owner`, `userId`, `createdBy`, `authorId`, `accountId`, `tenantId`, `role`, `isAdmin`, `permissions`, `scopes`...) assigned or set in an object literal from request input, including `req.body.ownerId || req.auth.userId`. Also flags copying all of `req.body`/`req.query` onto a record with `Object.assign(record, req.body)` or `{ ...req.body }`.

**Severity:** High. The client can send any value: create records in someone else's name, move a record to their account, or give themselves a role.

**Risky examples:**
```js
documents.push({ ownerId: req.body.ownerId || req.auth.userId, content: req.body.content });
document.ownerId = req.body.ownerId ?? document.ownerId;
Object.assign(req.user, req.body);
```

**Safe example (not flagged):**
```js
notes.push({ ownerId: req.user.id, text: req.body.text });
```

**Limitations:** name-based on the field. An admin-only endpoint that's meant to set a role from the request is still flagged; check it's behind a role guard and dismiss it.

**Tests:** `tests/fixtures/vulnerable/express-owner-from-request-body.ts`, `express-mass-assignment-req-body.ts`, `express-workspace-service-audit.ts` · safe: `tests/fixtures/safe/express-owner-from-session-safe.ts`

---

## express-admin-route-without-role-check

**What it flags:** a route whose path has an `/admin` segment (`app.post("/admin/promote", ...)`), with no admin/role middleware on the route (names like `adminOnly`, `requireRole(...)`, `authorize`, `checkPermission`), no role guard mounted on its prefix with `app.use("/admin", ...)`, and no role check of the caller inside the handler (`if (req.user.role !== "admin")`).

**Severity:** High. Being logged in isn't being an admin: any signed-in user who finds the URL can run it.

**Risky example:**
```js
app.post("/admin/promote", authenticated, (req, res) => {
  users.find((u) => u.id === Number(req.body.userId)).role = "admin";
  res.json({ promoted: true });
});
```

**Safe examples (not flagged):**
```js
app.delete("/admin/users/:id", authenticated, adminOnly, handler);
app.use("/admin", authenticated, requireRole("admin"));
app.post("/admin/flags", authenticated, (req, res) => { if (req.user.role !== "admin") return res.sendStatus(403); /* ... */ });
```

**Limitations:** recognises guards by name. A role check done inside a helper function, or admin routes on a router mounted under a different name, can still be flagged; an admin area that doesn't use "admin" in its paths isn't checked.

**Tests:** `tests/fixtures/vulnerable/express-admin-promote-no-role-check.ts`, `express-workspace-service-audit.ts` · safe: `tests/fixtures/safe/express-admin-guarded-safe.ts`

---

## express-missing-ownership-check

**A heuristic, and labelled as one on every finding.** Whether a user should see a record depends on what the app is for, which no pattern can know for certain.

**What it flags:** a route that requires a login (login-style middleware on the route, or mounted with `app.use(...)` on its prefix or the whole app), then looks a record up with an id from the request (`req.params.*`, or an `...Id` field of `req.body`/`req.query`, passed to `find`/`findById`/`findOne`/`findByPk`/`filter`/...), and never reads the current user anywhere in the handler (`req.user`, `req.auth`, `req.session`, `res.locals.user`, `ctx.state.user`). Routes with a role guard are skipped (admins usually may access any record).

**Severity:** Medium, because it's a heuristic. When it's right, it's the most common access-control bug in real APIs (IDOR / broken object-level authorization).

**Risky example:**
```js
app.get("/documents/:id", authenticated, (req, res) => {
  res.json(documents.find((d) => d.id === Number(req.params.id)));
});
```

**Safe examples (not flagged):**
```js
// checked against the caller
if (!doc || doc.ownerId !== req.auth.userId) return res.status(404).end();
// or looked up scoped to them
await Order.findOne({ _id: req.params.id, user: req.user.id });
// a public route with no login: looking up by id is the point
app.get("/products/:id", async (req, res) => res.json(await Product.findById(req.params.id)));
```

**Limitations:** a check done inside a helper function, or a query scoped some other way, still gets flagged; a route that's meant to show any record to any logged-in user (a shared team space) gets flagged too. A route with no recognisable login middleware isn't checked at all.

**Tests:** `tests/fixtures/vulnerable/express-bola-document-by-id.ts`, `express-bola-mounted-auth.ts`, `express-workspace-service-audit.ts` · safe: `tests/fixtures/safe/express-ownership-checked-safe.ts`, `express-public-lookup-safe.ts`
