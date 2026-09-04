# SQL injection — narrow heuristic — `sqli.ts`

Source: [`src/lib/analysis/rules/sqli.ts`](../../src/lib/analysis/rules/sqli.ts) · Tests: [`tests/rules/sqli.test.ts`](../../tests/rules/sqli.test.ts), [`tests/regression/parameterized-query.test.ts`](../../tests/regression/parameterized-query.test.ts) · Category: `sqli`

This is deliberately **not** a general SQL-injection detector. It flags one specific shape: string concatenation (`+`) or template-literal interpolation (`${...}`) passed to a recognized query-execution method — directly, or traced back **one variable hop**. Every finding this rule produces shares a single `ruleId` regardless of which method matched, because the underlying pattern (dynamic SQL reaching a query call) is identical in every case; the message itself names the specific method.

---

## sqli-dynamic-query

**What it flags:** Dynamic SQL (concatenation/interpolation) reaching:
- `.query()` — only on a receiver whose name looks DB-shaped: `db`, `client`, `connection`/`conn`, `pool`, `sql`, `sequelize`, `dataSource`, `queryRunner` (case-insensitive, checked on the identifier or the last member-expression property).
- `.execute()`, `.raw()`, `.unsafe()`, `.$queryRawUnsafe()`, `.$executeRawUnsafe()` — flagged regardless of receiver name; these names are specific enough that qualifying the receiver would only lose recall for no precision gained.

**Severity:** Always High. There is **no sanitizer-recognition path** for this rule at all — unlike `xss.ts`, a value that's itself the result of calling something that looks like a real escaping function still gets full High severity, with no downgrade available. This is a real, disclosed gap (see `sqli-no-sanitizer-downgrade-path` below), not an oversight.

**Risky examples:**
```js
db.query("SELECT * FROM users WHERE id = " + id);                        // direct concatenation
const query = "SELECT * FROM users WHERE id = " + id; db.query(query);   // one-hop trace
client.query(`SELECT * FROM users WHERE email = '${email}'`);            // template interpolation
sequelize.query("SELECT * FROM users WHERE status = '" + status + "'");  // qualified ORM receiver
prisma.$queryRawUnsafe("SELECT * FROM users WHERE id = " + id);          // unqualified, name-specific method
```

**Safe examples:**
```js
db.query("SELECT * FROM users WHERE id = $1", [id]);       // parameterized — NOT flagged
client.query("SELECT * FROM users WHERE email = ?", [email]); // parameterized — NOT flagged
prisma.user.findUnique({ where: { id } });                   // ORM query builder — NOT flagged
prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`;      // tagged template — auto-parameterized by Prisma, and structurally a different AST node (TaggedTemplateExpression) this rule's CallExpression visitor never even sees
searchIndex.query({ text: term });                            // 'searchIndex' isn't DB-shaped — NOT flagged
manager.query("SELECT * FROM users WHERE id = " + id);        // KNOWN MISS — bare 'manager' deliberately excluded, see Limitations
```

**Limitations:**
- No general data-flow analysis: a value assembled in a *different function*, or passed through a *second* variable hop, is not tracked (`const raw = "..." + id; const query = raw; db.query(query);` is missed — `sqli-concat-via-two-hop-variable-not-caught`).
- An *unresolved* identifier passed to `.query()` is never flagged, even if it holds unescaped SQL built elsewhere — deliberate, since a variable holding a parameterized query string is the extremely common, safe case, and flagging every unresolved identifier would make this mostly noise.
- Bare `manager` is deliberately **not** in the qualified-receiver list, even though TypeORM's `EntityManager` is commonly named exactly that — cache/state/task managers commonly expose their own unrelated `.query`-shaped methods, and qualifying it would reintroduce the same generic-name noise risk `db`/`client` already avoid. A real, accepted false negative (`sqli-typeorm-manager-not-qualified`).
- No sanitizer-recognition path (see above) — `db.query("... " + escapeSql(name) + " ...")` is still flagged High even though `escapeSql` might be real escaping, because this rule can't verify that any more than it can verify a raw concatenation is dangerous (`sqli-no-sanitizer-downgrade-path`).

**Tests:** `tests/fixtures/vulnerable/sqli-concat-db-query.ts`, `sqli-concat-via-one-hop-variable.ts`, `sqli-template-client-query.ts`, `sqli-knex-raw-concat.ts`, `sqli-connection-query-concat.ts`, `sqli-pool-execute-template.ts`, `sqli-unsafe-concat.ts`, `sqli-sequelize-query-concat.ts`, `sqli-typeorm-datasource-query-template.ts`, `sqli-typeorm-queryrunner-concat.ts`, `sqli-prisma-query-raw-unsafe-concat.ts`, `sqli-prisma-execute-raw-unsafe-template.ts` · `tests/fixtures/safe/sqli-parameterized-placeholder.ts`, `sqli-parameterized-question-mark.ts`, `sqli-orm-prisma.ts`, `sqli-orm-active-record-style.ts`, `sqli-prisma-query-raw-tagged-template-safe.ts` · `tests/fixtures/edge-cases/sqli-concat-via-two-hop-variable-not-caught.ts`, `sqli-typeorm-manager-not-qualified.ts`, `sqli-no-sanitizer-downgrade-path.ts` · `tests/independent-benchmark/samples/user-profile-api.js`, `report-export.js`, `reports-controller.ts`
