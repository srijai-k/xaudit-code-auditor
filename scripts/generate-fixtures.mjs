// One-time generator: writes physical fixture files + tests/expected-results.json
// from a single source-of-truth corpus array. Re-run any time the corpus changes;
// the fixture files and expected-results.json are committed, this script is not
// part of the runtime or the test run itself.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const testsDir = path.join(root, "..", "tests");

/**
 * label: "vulnerable" | "safe"
 * bucket: physical folder under tests/fixtures/
 * expectRuleIds: rule IDs that MUST appear for vulnerable cases (>=1 match required)
 * forbidSeverity: for safe cases, no finding at or above this severity is allowed (default "high")
 */
const CORPUS = [
    // ===================== XSS (10) =====================
    { id: "xss-inner-html-user-input", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-inner-html"], note: "raw innerHTML from parameter",
      code: `function render(userInput) {\n  const el = document.getElementById('out');\n  el.innerHTML = userInput;\n  return el;\n}\n` },
    { id: "xss-outer-html-alias", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-outer-html"], note: "outerHTML via aliased element",
      code: `const sink = document.getElementById('x');\nfunction setter(v) { sink.outerHTML = v; }\nsetter(location.hash.slice(1));\n` },
    { id: "xss-insert-adjacent-html", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-insert-adjacent-html"], note: "insertAdjacentHTML with dynamic value",
      code: `function append(el, userBio) {\n  el.insertAdjacentHTML('beforeend', userBio);\n  return el;\n}\n` },
    { id: "xss-document-write", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-document-write"], note: "document.write with template interpolation",
      code: `function trackPixel(id) {\n  document.write(\`<img src="/pixel?id=\${id}">\`);\n}\n` },
    { id: "xss-document-writeln", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-document-writeln"], note: "document.writeln with concatenation",
      code: `function legacyWrite(name) {\n  document.writeln("<h1>Hello " + name + "</h1>");\n}\n` },
    { id: "xss-dangerously-set-inner-html", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-dangerously-set-inner-html"], note: "React dangerouslySetInnerHTML, unsanitized",
      code: `export default function Comment({ body }) {\n  return <div dangerouslySetInnerHTML={{ __html: body }} />;\n}\n` },
    { id: "xss-template-literal-inner-html", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-inner-html"], note: "template literal built into innerHTML",
      code: `function show(user) {\n  const box = document.querySelector('.box');\n  box.innerHTML = \`<span>\${user.bio}</span>\`;\n  return box;\n}\n` },
    { id: "xss-sanitized-dompurify", group: "xss", bucket: "safe", forbidSeverity: "high", note: "sanitized via DOMPurify before innerHTML (should be low, not high)",
      code: `import DOMPurify from 'dompurify';\nfunction render(userInput) {\n  const el = document.getElementById('out');\n  el.innerHTML = DOMPurify.sanitize(userInput);\n  return el;\n}\n` },
    { id: "xss-static-literal-inner-html", group: "xss", bucket: "safe", forbidSeverity: "high", note: "constant literal HTML, no dynamic value at all",
      code: `function render() {\n  const el = document.getElementById('out');\n  el.innerHTML = '<b>Static Label</b>';\n  return el;\n}\n` },
    { id: "xss-literal-via-one-hop-variable", group: "xss", bucket: "safe", forbidSeverity: "high", note: "a literal assigned to a variable one step before the sink — fixed false positive: this used to be flagged (the identifier itself is never a literal by syntax) even though the traced value is a plain string",
      code: `function render() {\n  const safe = "<b>hi</b>";\n  const el = document.getElementById('x');\n  el.innerHTML = safe;\n  return el;\n}\n` },
    { id: "xss-sanitizer-via-one-hop-variable", group: "xss", bucket: "edge-cases", expectRuleIds: ["xss-inner-html"], expectSeverity: "low", note: "DOMPurify.sanitize() called one step before the sink, through a variable — now recognized as sanitized (severity low) where before the sanitizer call was invisible behind the identifier",
      code: `import DOMPurify from 'dompurify';\nfunction render(userInput) {\n  const clean = DOMPurify.sanitize(userInput);\n  const el = document.getElementById('out');\n  el.innerHTML = clean;\n  return el;\n}\n` },
    { id: "xss-literal-via-two-hop-variable-still-flagged", group: "xss", bucket: "edge-cases", expectRuleIds: ["xss-inner-html"], note: "KNOWN FALSE POSITIVE, documented on purpose: same-scope tracing is exactly one hop — a literal passed through a SECOND variable before the sink is still (incorrectly) flagged",
      code: `function render() {\n  const original = "<b>hi</b>";\n  const safe = original;\n  const el = document.getElementById('x');\n  el.innerHTML = safe;\n  return el;\n}\n` },
    { id: "xss-react-escaped-text", group: "xss", bucket: "safe", forbidSeverity: "high", note: "React default text interpolation (auto-escaped)",
      code: `export default function Greeting({ name }) {\n  return <div>Hello, {name}! Welcome back to the dashboard.</div>;\n}\n` },
    { id: "xss-iframe-srcdoc-dynamic", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-iframe-srcdoc"], note: "new sink: iframe.srcdoc assigned a dynamic value — renders as a full HTML document, scripts included",
      code: `function preview(frame, userHtml) {\n  frame.srcdoc = userHtml;\n  return frame;\n}\n` },
    { id: "xss-iframe-srcdoc-static-literal", group: "xss", bucket: "safe", forbidSeverity: "high", note: "new sink, safe case: a fixed literal assigned to iframe.srcdoc must NOT be flagged",
      code: `function preview(frame) {\n  frame.srcdoc = '<p>Loading…</p>';\n  return frame;\n}\n` },
    { id: "xss-jquery-html-direct-chain", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-jquery-html"], note: "new sink: $('...').html(dynamic) — direct jQuery-rooted chain",
      code: `function render(userBio) {\n  $('#profile-bio').html(userBio);\n}\n` },
    { id: "xss-jquery-html-cached-object-one-hop", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-jquery-html"], note: "new sink: a jQuery object cached in a variable one hop before .html() — the common $el = $(...) convention",
      code: `function render(userBio) {\n  const $bio = $('#profile-bio');\n  $bio.html(userBio);\n}\n` },
    { id: "xss-jquery-html-dollar-prefixed-param", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-jquery-html"], note: "new sink: a jQuery/jqLite object passed in as a $-prefixed parameter (jQuery plugin / AngularJS 1.x directive link function convention) — unresolvable to a declaration, caught by the naming-convention fallback",
      code: `function linkDirective(scope, $element) {\n  $element.html(scope.userBio);\n}\n` },
    { id: "xss-jquery-html-this-dollar-property-chain", group: "xss", bucket: "vulnerable", expectRuleIds: ["xss-jquery-html"], note: "new sink: this.$container.find(...).html(dynamic) — the Backbone.View/jQuery-widget convention of caching a jQuery object as a $-prefixed instance property, then chaining off it",
      code: `function ProfileWidget() {\n  this.$container = $('#profile-widget');\n}\nProfileWidget.prototype.renderBio = function (bio) {\n  this.$container.find('.bio').html(bio);\n};\n` },
    { id: "xss-jquery-html-static-literal", group: "xss", bucket: "safe", forbidSeverity: "high", note: "new sink, safe case: a fixed literal passed to jQuery .html() must NOT be flagged",
      code: `function render() {\n  $('#status').html('<b>Ready</b>');\n}\n` },
    { id: "xss-jquery-html-sanitized", group: "xss", bucket: "safe", forbidSeverity: "high", note: "new sink, safe case: jQuery .html() wrapped in DOMPurify.sanitize() must be downgraded to low, not high",
      code: `import DOMPurify from 'dompurify';\nfunction render(userBio) {\n  $('#profile-bio').html(DOMPurify.sanitize(userBio));\n}\n` },
    { id: "xss-html-method-on-unrelated-object", group: "xss", bucket: "safe", forbidSeverity: "high", note: "regression: a .html() method on an object that is neither jQuery-rooted nor $-prefixed must NOT be flagged — 'report' is not a jQuery-shaped receiver",
      code: `function render(userBio) {\n  return report.html(userBio);\n}\n` },

    // ===================== SQLi (10) =====================
    { id: "sqli-concat-db-query", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "string concatenation directly in the db.query() call",
      code: `function getUser(id) {\n  return db.query("SELECT * FROM users WHERE id = " + id);\n}\n` },
    { id: "sqli-concat-via-one-hop-variable", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "concatenation built one variable hop before the call — now caught via same-scope tracing (previously a documented false negative; fixed)",
      code: `function getUser(id) {\n  const query = "SELECT * FROM users WHERE id = " + id;\n  return db.query(query);\n}\n` },
    { id: "sqli-concat-via-two-hop-variable-not-caught", group: "sqli", bucket: "edge-cases", forbidSeverity: "high", note: "KNOWN FALSE NEGATIVE, documented on purpose: same-scope tracing is exactly one hop — a value passed through a SECOND variable before reaching the call is still not caught",
      code: `function getUser(id) {\n  const raw = "SELECT * FROM users WHERE id = " + id;\n  const query = raw;\n  return db.query(query);\n}\n` },
    { id: "sqli-template-client-query", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "template literal interpolation into client.query",
      code: `function search(email) {\n  return client.query(\`SELECT * FROM users WHERE email = '\${email}'\`);\n}\n` },
    { id: "sqli-knex-raw-concat", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "knex.raw with concatenation",
      code: `function search(term) {\n  return knex.raw("SELECT * FROM items WHERE name = '" + term + "'");\n}\n` },
    { id: "sqli-connection-query-concat", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "connection.query direct concatenation",
      code: `function del(token) {\n  return connection.query("DELETE FROM sessions WHERE token = '" + token + "'");\n}\n` },
    { id: "sqli-pool-execute-template", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: ".execute with template interpolation",
      code: `async function byId(id) {\n  return pool.execute(\`SELECT * FROM orders WHERE id = \${id}\`);\n}\n` },
    { id: "sqli-unsafe-concat", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: ".unsafe with concatenation",
      code: `function raw(term) {\n  return sql.unsafe("SELECT * FROM logs WHERE msg = '" + term + "'");\n}\n` },
    { id: "sqli-parameterized-placeholder", group: "sqli", bucket: "safe", forbidSeverity: "high", note: "parameterized query with $1 placeholder — must NOT flag",
      code: `function getUser(id) {\n  const query = "SELECT * FROM users WHERE id = $1";\n  return db.query(query, [id]);\n}\n` },
    { id: "sqli-parameterized-question-mark", group: "sqli", bucket: "safe", forbidSeverity: "high", note: "parameterized query with ? placeholder — must NOT flag",
      code: `function getUser(email) {\n  return client.query("SELECT * FROM users WHERE email = ?", [email]);\n}\n` },
    { id: "sqli-orm-prisma", group: "sqli", bucket: "safe", forbidSeverity: "high", note: "ORM query builder, no raw SQL at all",
      code: `async function getUser(id) {\n  const user = await prisma.user.findUnique({ where: { id } });\n  return user;\n}\n` },
    { id: "sqli-orm-active-record-style", group: "sqli", bucket: "safe", forbidSeverity: "high", note: "query-builder .query on non-db-shaped receiver name — not qualified, must NOT flag",
      code: `function search(term) {\n  return searchIndex.query({ text: term });\n}\n` },
    { id: "sqli-sequelize-query-concat", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "new: sequelize.query() with concatenation — Sequelize raw-query escape hatch",
      code: `function getUser(id) {\n  return sequelize.query("SELECT * FROM users WHERE id = " + id);\n}\n` },
    { id: "sqli-typeorm-datasource-query-template", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "new: TypeORM DataSource.query() with template interpolation",
      code: `function getUser(id) {\n  return dataSource.query(\`SELECT * FROM users WHERE id = \${id}\`);\n}\n` },
    { id: "sqli-typeorm-queryrunner-concat", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "new: TypeORM QueryRunner.query() with concatenation",
      code: `function del(token) {\n  return queryRunner.query("DELETE FROM sessions WHERE token = '" + token + "'");\n}\n` },
    { id: "sqli-prisma-query-raw-unsafe-concat", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "new: Prisma's explicitly-named unsafe raw-query escape hatch, called as a plain function with concatenation",
      code: `function getUser(id) {\n  return prisma.$queryRawUnsafe("SELECT * FROM users WHERE id = " + id);\n}\n` },
    { id: "sqli-prisma-execute-raw-unsafe-template", group: "sqli", bucket: "vulnerable", expectRuleIds: ["sqli-dynamic-query"], note: "new: Prisma $executeRawUnsafe with template interpolation",
      code: `function rename(id, name) {\n  return prisma.$executeRawUnsafe(\`UPDATE users SET name = '\${name}' WHERE id = \${id}\`);\n}\n` },
    { id: "sqli-prisma-query-raw-tagged-template-safe", group: "sqli", bucket: "safe", forbidSeverity: "high", note: "Prisma's $queryRaw used as a TAGGED template literal auto-parameterizes each ${} and is safe by design — must NOT flag. Also structurally a TaggedTemplateExpression, never a CallExpression, so this rule's visitor never even sees it.",
      code: `function getUser(id) {\n  return prisma.$queryRaw\`SELECT * FROM users WHERE id = \${id}\`;\n}\n` },
    { id: "sqli-typeorm-manager-not-qualified", group: "sqli", bucket: "edge-cases", forbidSeverity: "high", note: "KNOWN FALSE NEGATIVE, documented on purpose: bare 'manager' is deliberately NOT in the qualified-receiver list (too generic — cache/state/task managers commonly expose unrelated .query-shaped methods), so TypeORM's manager.query() with real concatenated SQL is missed here",
      code: `function getUser(id) {\n  return manager.query("SELECT * FROM users WHERE id = " + id);\n}\n` },

    // ===================== Secrets (10) =====================
    { id: "secret-openai-key", group: "secrets", bucket: "vulnerable", expectRuleIds: ["secret-openai"], note: "OpenAI-shaped key literal",
      code: `const client = new OpenAI({\n  apiKey: "sk-proj-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR"\n});\nclient.models.list();\n` },
    { id: "secret-anthropic-key", group: "secrets", bucket: "vulnerable", expectRuleIds: ["secret-anthropic"], note: "Anthropic-shaped key literal",
      code: `const key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";\nconsole.log(key.length);\n` },
    { id: "secret-stripe-live-key", group: "secrets", bucket: "vulnerable", expectRuleIds: ["secret-stripe"], note: "Stripe live secret key",
      code: `const stripeKey = "sk_live_51MfYs9L0yR2eR0f7vR0f7vR0f7vR0f7v";\ncharge(stripeKey);\n` },
    { id: "secret-aws-access-key", group: "secrets", bucket: "vulnerable", expectRuleIds: ["secret-aws"], note: "AWS access key ID",
      code: `const AWS_ACCESS_KEY_ID = "AKIAABCDEFGHIJKLMNOP";\nconnect(AWS_ACCESS_KEY_ID);\n` },
    { id: "secret-github-pat", group: "secrets", bucket: "vulnerable", expectRuleIds: ["secret-github-pat"], note: "GitHub PAT",
      code: `const token = "ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ";\nfetchRepo(token);\n` },
    { id: "secret-generic-password-assignment", group: "secrets", bucket: "vulnerable", expectRuleIds: ["secret-generic-assignment"], note: "generic PASSWORD-named variable with a real-looking value",
      code: `const DB_PASSWORD = "Tr0ub4dor&3Correct horse";\nconnect(DB_PASSWORD);\n` },
    { id: "secret-env-var-usage", group: "secrets", bucket: "safe", forbidSeverity: "medium", note: "proper env-var usage, no literal secret at all",
      code: `const client = new OpenAI({\n  apiKey: process.env.OPENAI_API_KEY\n});\nclient.models.list();\n` },
    { id: "secret-placeholder-example", group: "secrets", bucket: "safe", forbidSeverity: "medium", note: "documentation placeholder value must be excluded outright",
      code: `// Example .env usage — replace with your own key\nconst OPENAI_API_KEY = "your_key_here_example";\nconsole.log(OPENAI_API_KEY);\n` },
    { id: "secret-firebase-public-config", group: "secrets", bucket: "edge-cases", expectRuleIds: ["secret-google-api-key"], expectSeverity: "info", note: "intentionally-public Firebase web config key — must be labelled informational, not a leak, and must NOT be mislabeled as a different vendor",
      code: `const firebaseConfig = {\n  apiKey: "AIzaSyD1234567890abcdefghijklmnopqrstuv",\n  authDomain: "demo-app.firebaseapp.com",\n  projectId: "demo-app"\n};\ninitializeApp(firebaseConfig);\n` },
    { id: "secret-uuid-not-flagged", group: "secrets", bucket: "safe", forbidSeverity: "low", note: "a bare UUID (e.g. a React key or trace id) must NOT be reported as any vendor secret, and — now that the entropy fallback exists — must not be flagged by that path either (explicit UUID exclusion)",
      code: `const requestId = "550e8400-e29b-41d4-a716-446655440000";\nlogRequest(requestId);\n` },
    { id: "secret-entropy-non-credential-name", group: "secrets", bucket: "vulnerable", expectRuleIds: ["secret-high-entropy-string"], expectSeverity: "low", note: "new: a high-entropy token-shaped value assigned to a name the existing name-context check doesn't recognize as credential-shaped",
      code: `const CONFIG_VALUE = "kJ8xz92mVpQ7Bn3zRtY6WcL0hF4sD1aG5eK9jH2p";\nsetup(CONFIG_VALUE);\n` },
    { id: "secret-entropy-authorization-header", group: "secrets", bucket: "vulnerable", expectRuleIds: ["secret-high-entropy-string"], expectSeverity: "low", note: "new: a high-entropy token passed directly as a header value with no named variable at all — invisible to the name-context check by construction",
      code: `function callApi() {\n  return fetch('/api/data', { headers: { Authorization: "kJ8xz92mVpQ7Bn3zRtY6WcL0hF4sD1aG5eK9jH2p" } });\n}\n` },
    { id: "secret-entropy-git-sha-not-flagged", group: "secrets", bucket: "safe", forbidSeverity: "low", note: "adversarial: a 40-char pure-hex git SHA-1 must NOT be flagged by the entropy fallback (canonical hash length + pure-hex exclusion)",
      code: `const commitSha = "da39a3ee5e6b4b0d3255bfef95601890afd80709";\nlogBuild(commitSha);\n` },
    { id: "secret-entropy-npm-integrity-not-flagged", group: "secrets", bucket: "safe", forbidSeverity: "low", note: "adversarial: an npm/yarn SRI 'integrity' hash has high entropy but must NOT be flagged (sha512- prefix exclusion) — a real false positive found during calibration, before shipping",
      code: `const resolved = {\n  integrity: "sha512-abc123DEFghiJKLmnoPQRstuVWXyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno=="\n};\n` },
    { id: "secret-entropy-cdn-url-not-flagged", group: "secrets", bucket: "safe", forbidSeverity: "low", note: "adversarial: a CDN URL with a hashed filename has entropy close to a real token's but must NOT be flagged (URL-shape exclusion)",
      code: `const assetUrl = "https://cdn.example.com/assets/main-8f3a9c2e1b7d4f6a.js";\nloadScript(assetUrl);\n` },
    { id: "secret-entropy-base64-image-not-flagged", group: "secrets", bucket: "safe", forbidSeverity: "low", note: "adversarial: a base64 image/font blob must NOT be flagged (falls under the entropy bar in calibration — base64 alphabets skew lower-entropy than true random tokens at this sample length)",
      code: `const iconDataUrl = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";\nrenderIcon(iconDataUrl);\n` },
    { id: "secret-entropy-long-identifier-not-flagged", group: "secrets", bucket: "safe", forbidSeverity: "low", note: "adversarial: a long, versioned SNAKE_CASE/identifier-style string must NOT be flagged (letter-heavy, under the entropy bar)",
      code: `const featureFlagKey = "component_v2_button_primary_large_disabled_state_2024_final";\ncheckFlag(featureFlagKey);\n` },

    // ===================== Dangerous execution (8) =====================
    { id: "exec-eval-dynamic", group: "exec", bucket: "vulnerable", expectRuleIds: ["exec-eval"], note: "eval on a parameter",
      code: `function run(expr) {\n  return eval(expr);\n}\n` },
    { id: "exec-eval-literal", group: "exec", bucket: "vulnerable", expectRuleIds: ["exec-eval"], note: "eval on a fixed literal — still flagged, described accurately",
      code: `function run() {\n  return eval("1 + 1");\n}\n` },
    { id: "exec-new-function", group: "exec", bucket: "vulnerable", expectRuleIds: ["exec-function-ctor"], note: "new Function constructor",
      code: `function build(body) {\n  const fn = new Function('x', body);\n  return fn(5);\n}\n` },
    { id: "exec-function-call-form", group: "exec", bucket: "vulnerable", expectRuleIds: ["exec-function-ctor"], note: "Function(...) called without new",
      code: `function build(body) {\n  const fn = Function('x', body);\n  return fn(5);\n}\n` },
    { id: "exec-set-timeout-string", group: "exec", bucket: "vulnerable", expectRuleIds: ["exec-set-timeout-string"], note: "setTimeout with a concatenated string body",
      code: `function schedule(userCode) {\n  setTimeout("doSomething(" + userCode + ")", 1000);\n}\n` },
    { id: "exec-set-interval-string", group: "exec", bucket: "vulnerable", expectRuleIds: ["exec-set-interval-string"], note: "setInterval with a template-literal string body",
      code: `function poll(expr) {\n  setInterval(\`checkStatus(\${expr})\`, 5000);\n}\n` },
    { id: "exec-set-timeout-function-ref", group: "exec", bucket: "safe", forbidSeverity: "high", note: "setTimeout with a function reference — must NOT flag",
      code: `function schedule(cb) {\n  setTimeout(() => { cb(); }, 1000);\n}\nschedule(() => console.log('tick'));\n` },
    { id: "exec-no-dynamic-execution", group: "exec", bucket: "safe", forbidSeverity: "high", note: "fixed, non-dynamic function call, no eval-family API at all",
      code: `function total(a, b) {\n  return a + b;\n}\nconsole.log(total(2, 3));\n` },
    { id: "exec-dynamic-import-nonliteral-not-flagged", group: "exec", bucket: "safe", forbidSeverity: "high", note: "REVERTED CHECK, documented on purpose (see docs/model-improvements.md): import() with a computed specifier was briefly flagged, then removed after live testing showed it fires on the standard route/locale code-splitting idiom — indistinguishable from this via AST shape alone. Must NOT flag.",
      code: `async function loadLocale(locale) {\n  const messages = await import(\`./locales/\${locale}.json\`);\n  return messages.default;\n}\n` },
    { id: "exec-require-nonliteral-not-flagged", group: "exec", bucket: "safe", forbidSeverity: "high", note: "REVERTED CHECK, documented on purpose (see docs/model-improvements.md): require() with a computed specifier (plugin/strategy-loading idiom) — same reversal, must NOT flag.",
      code: `function loadStrategy(name) {\n  return require('./strategies/' + name);\n}\n` },

    // ===================== Node command injection (5, bonus rule group) =====================
    { id: "node-exec-dynamic", group: "node-command", bucket: "vulnerable", expectRuleIds: ["node-command-exec-dynamic"], note: "exec() with concatenated user input",
      code: `const { exec } = require('child_process');\nfunction run(userInput) {\n  exec("ls " + userInput);\n}\n` },
    { id: "node-exec-sync-dynamic", group: "node-command", bucket: "vulnerable", expectRuleIds: ["node-command-exec-dynamic"], note: "execSync() with template literal",
      code: `const { execSync } = require('child_process');\nfunction run(branch) {\n  execSync(\`git checkout \${branch}\`);\n}\n` },
    { id: "node-spawn-shell-true-dynamic", group: "node-command", bucket: "vulnerable", expectRuleIds: ["node-command-spawn-shell"], note: "spawn with shell:true and dynamic arg",
      code: `const { spawn } = require('child_process');\nfunction run(name) {\n  spawn("echo " + name, [], { shell: true });\n}\n` },
    { id: "node-execfile-fixed-args", group: "node-command", bucket: "safe", forbidSeverity: "high", note: "execFile with fixed command and static args — must NOT flag (different API, out of scope)",
      code: `const { execFile } = require('child_process');\nfunction status() {\n  execFile("git", ["status"]);\n}\n` },
    { id: "node-spawn-no-shell", group: "node-command", bucket: "safe", forbidSeverity: "high", note: "spawn without shell:true — must NOT flag",
      code: `const { spawn } = require('child_process');\nfunction run(name) {\n  spawn("echo", [name]);\n}\n` },

    // ===================== React/JSX false-positive regression (5) =====================
    { id: "react-onclick-handler", group: "react-regression", bucket: "safe", forbidSeverity: "medium", note: "standard onClick prop must never be reported as XSS/RCE",
      code: `export default function Button() {\n  const handleClick = () => console.log('clicked');\n  return <button onClick={handleClick}>Submit</button>;\n}\n` },
    { id: "react-onchange-onsubmit", group: "react-regression", bucket: "safe", forbidSeverity: "medium", note: "onChange/onSubmit props must never be reported as XSS/RCE",
      code: `export default function Form({ onSave }) {\n  const handleChange = (e) => console.log(e.target.value);\n  const handleSubmit = (e) => { e.preventDefault(); onSave(); };\n  return <form onSubmit={handleSubmit}><input onChange={handleChange} /></form>;\n}\n` },
    { id: "react-usememo-usecallback-correct", group: "react-regression", bucket: "safe", forbidSeverity: "medium", note: "idiomatic memoization must not itself be flagged as a security issue",
      code: `import { useMemo, useCallback } from 'react';\nexport default function List({ items }) {\n  const style = useMemo(() => ({ color: 'red' }), []);\n  const onClick = useCallback(() => console.log('x'), []);\n  return <Child style={style} data={items} onClick={onClick} />;\n}\n` },
    { id: "react-inline-object-and-onclick", group: "react-regression", bucket: "safe", forbidSeverity: "medium", note: "inline object/arrow props with onClick — a performance nit at most, never a critical XSS finding",
      code: `export default function Row({ item }) {\n  return <div style={{ color: 'blue' }} onClick={() => console.log(item.id)}>{item.label}</div>;\n}\n` },
    { id: "react-dangerously-set-sanitized", group: "react-regression", bucket: "safe", forbidSeverity: "high", note: "dangerouslySetInnerHTML wrapped in DOMPurify.sanitize must be low severity, not high/critical",
      code: `import DOMPurify from 'dompurify';\nexport default function Post({ html }) {\n  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;\n}\n` },

    // ===================== General safe examples, no high/critical at all (5) =====================
    { id: "safe-plain-component", group: "general-safe", bucket: "safe", forbidSeverity: "medium", note: "ordinary, unremarkable React component",
      code: `export default function Card({ title, description }) {\n  return (\n    <section>\n      <h2>{title}</h2>\n      <p>{description}</p>\n    </section>\n  );\n}\n` },
    { id: "safe-math-utils", group: "general-safe", bucket: "safe", forbidSeverity: "medium", note: "plain utility functions, nothing dangerous",
      code: `export function clamp(value, min, max) {\n  return Math.min(Math.max(value, min), max);\n}\nexport function average(nums) {\n  return nums.reduce((a, b) => a + b, 0) / nums.length;\n}\n` },
    { id: "safe-fetch-json", group: "general-safe", bucket: "safe", forbidSeverity: "medium", note: "typical async data-fetching code",
      code: `export async function loadUser(id) {\n  const res = await fetch(\`/api/users/\${id}\`);\n  const data = await res.json();\n  return data;\n}\n` },
    { id: "safe-typescript-interfaces", group: "general-safe", bucket: "safe", forbidSeverity: "medium", note: "plain TypeScript types/interfaces, verifies TS syntax parses cleanly",
      code: `interface User {\n  id: string;\n  name: string;\n  roles: string[];\n}\nexport function isAdmin(user: User): boolean {\n  return user.roles.includes('admin');\n}\n` },
    { id: "safe-class-component", group: "general-safe", bucket: "safe", forbidSeverity: "medium", note: "legacy class component with lifecycle methods, no dangerous patterns",
      code: `import React from 'react';\nexport default class Profile extends React.Component {\n  componentDidMount() {\n    console.log('mounted');\n  }\n  render() {\n    return <div>{this.props.name}</div>;\n  }\n}\n` },
];

mkdirSync(path.join(testsDir, "fixtures", "vulnerable"), { recursive: true });
mkdirSync(path.join(testsDir, "fixtures", "safe"), { recursive: true });
mkdirSync(path.join(testsDir, "fixtures", "edge-cases"), { recursive: true });

const manifest = {};
for (const c of CORPUS) {
    const relPath = `fixtures/${c.bucket}/${c.id}.ts`;
    writeFileSync(path.join(testsDir, relPath), c.code, "utf8");
    manifest[c.id] = {
        path: relPath,
        group: c.group,
        bucket: c.bucket,
        expectRuleIds: c.expectRuleIds || [],
        expectSeverity: c.expectSeverity || null,
        forbidSeverity: c.forbidSeverity || null,
        note: c.note,
    };
}

writeFileSync(path.join(testsDir, "expected-results.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`Generated ${CORPUS.length} fixtures + tests/expected-results.json`);
const byGroup = {};
for (const c of CORPUS) byGroup[c.group] = (byGroup[c.group] || 0) + 1;
console.log(byGroup);
