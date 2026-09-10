import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import logoXa from '../assets/logo-xa.png';
import '../landing.css';

const SECTIONS = [
    { id: 'overview', title: 'Overview' },
    { id: 'checks', title: 'Current Supported Checks' },
    { id: 'unsupported', title: 'Unsupported Scope' },
    { id: 'local-exec', title: 'Local Execution & Privacy' },
    { id: 'export', title: 'Report Export Formats' },
    { id: 'scoring-removed', title: 'Scoring Removed' },
    { id: 'limitations', title: 'Limitations & Disclaimer' },
    { id: 'architecture', title: 'Architecture & Parsers' },
    { id: 'baseline', title: 'Pre-Rewrite Baseline Audit' },
    { id: 'improvements', title: 'Model Improvements Log' },
    { id: 'self-audit', title: 'Self-Audit (2026-09-03)' },
    { id: 'rules-reference', title: 'Exhaustive Rule Reference' },
];

export default function DocsPage() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('overview');

    return (
        <div className="landing-wrapper" style={{ background: '#222222' }}>
            <TopTicker />
            <main className="page-shell" style={{ background: '#f4f3ef', color: '#111', minHeight: '100vh', borderRadius: '32px' }}>
                <HeaderNav />

                <div className="page-shell-body">
                {/* Recentered Header Section */}
                <div style={{ padding: '48px 24px 32px', textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7c3aed', marginBottom: '20px', justifyContent: 'center' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>
                        Official Specification & Documentation
                    </div>
                    <h1 style={{ fontSize: '42px', fontWeight: 500, color: '#111', margin: '10px 0 16px', lineHeight: 1.15 }}>
                        XAUDIT Technical Reference
                    </h1>
                    <p style={{ color: '#555', fontSize: '16px', lineHeight: 1.6 }}>
                        Complete reference manual, rule specifications, self-audit report, model improvement changelog, and local execution details.
                    </p>
                </div>

                <div className="docs-layout">
                    {/* Sticky Sidebar Tab Navigation */}
                    <aside className="docs-sidebar">
                        <div className="docs-nav-title">DOCUMENTATION INDEX</div>
                        {SECTIONS.map((sec) => (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id)}
                                className={`docs-nav-item ${activeSection === sec.id ? 'active' : ''}`}
                            >
                                {sec.title}
                            </button>
                        ))}
                    </aside>

                    {/* Main Documentation Body (Renders ONLY active tab) */}
                    <div className="docs-content">
                        {/* Overview Section */}
                        {activeSection === 'overview' && (
                            <section id="overview" className="docs-card">
                                <h2>Overview</h2>
                                <p>
                                    XAUDIT is a client-side static code checker for a defined set of JavaScript, TypeScript, React/JSX, HTML, and package.json patterns. Analysis runs entirely in your browser, in a Web Worker, via a real AST parser (<code>@babel/parser</code>) for code and a JSON-based rule module for package.json — a small set of hand-written, unit-tested pattern rules — not an AI model, not regex guesswork over raw text.
                                </p>
                                <div className="docs-callout warning">
                                    <strong>Important Notice:</strong> XAUDIT reports potential issues that require human review. A clean result does not mean your code is secure.
                                </div>
                                <p>
                                    This is a rewrite of an earlier version of this project that made claims — "AI-powered," "WebAssembly," "zero false positives," "enterprise-grade," support for a dozen languages/frameworks — that the code behind it did not back up. Nothing in this documentation is aspirational; everything here has a test.
                                </p>
                            </section>
                        )}

                        {/* Current Supported Checks */}
                        {activeSection === 'checks' && (
                            <section id="checks" className="docs-card">
                                <h2>Current Supported Checks</h2>
                                <p>
                                    Only JavaScript, TypeScript, React/JSX, basic HTML, and package.json are analyzed. Every finding carries: what matched, why it matters, a safer example, and its own stated limitations. There is no letter grade, no "ship it" verdict, and no numeric score — that was removed on purpose (see <em>Scoring Removed</em>).
                                </p>

                                <table className="docs-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '22%' }}>Rule Group</th>
                                            <th style={{ width: '40%' }}>What it Flags</th>
                                            <th style={{ width: '38%' }}>What it Deliberately Does NOT Flag</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>DOM XSS</strong></td>
                                            <td><code>innerHTML</code>/<code>outerHTML</code>/<code>srcdoc</code> assignment, <code>insertAdjacentHTML</code>, <code>document.write</code>/<code>writeln</code>, React <code>dangerouslySetInnerHTML</code> (including variable resolution), jQuery/AngularJS-jqLite <code>.html()</code> on jQuery receivers, <code>javascript:</code> URI concatenation.</td>
                                            <td>Literal HTML strings; values wrapped in recognized sanitizers; JSX event props; jQuery <code>.append()</code>/<code>.prepend()</code>; ordinary dynamic redirects; non-jQuery <code>.html()</code> receivers.</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Dangerous Dynamic Execution</strong></td>
                                            <td><code>eval(...)</code>, <code>new Function(...)</code>, <code>Function(...)</code>, <code>setTimeout</code>/<code>setInterval</code> called with a string body.</td>
                                            <td><code>setTimeout</code>/<code>setInterval</code> called with a function reference; <code>import(...)</code>/<code>require(...)</code> with dynamic specifiers (reverted).</td>
                                        </tr>
                                        <tr>
                                            <td><strong>SQL Injection (Narrow Heuristic)</strong></td>
                                            <td>String concatenation or template interpolation passed to <code>.query</code>/<code>.execute</code>/<code>.raw</code>/<code>.unsafe</code>/<code>.$queryRawUnsafe</code>/<code>.$executeRawUnsafe</code>.</td>
                                            <td>Parameterized queries, ORM calls, Prisma tagged-template <code>$queryRaw</code>/<code>$executeRaw</code>, <code>.query()</code> on unqualified receivers.</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Hardcoded Secrets</strong></td>
                                            <td>Vendor-prefixed formats (OpenAI, Anthropic, Stripe, AWS, GitHub, GitLab, Slack, PEM private keys, Google API keys); generic name fallback; Shannon entropy fallback (≥ 4.5 bits/char).</td>
                                            <td>Bare UUIDs, canonical-length hex hashes, npm/yarn SRI integrity hashes, URLs/paths, base64 image/font blobs, placeholder values, public Firebase web-config keys.</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Node.js Command Patterns</strong></td>
                                            <td><code>exec</code>/<code>execSync</code> with a non-literal argument; <code>spawn(..., &#123; shell: true &#125;)</code> with a non-literal command/args.</td>
                                            <td><code>execFile</code> with static arguments; <code>spawn</code> without <code>shell: true</code>.</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Weak Authentication Patterns</strong></td>
                                            <td>A credential-shaped name compared directly against a string literal; <code>jwt.decode()</code> with no <code>jwt.verify()</code> anywhere in the same file.</td>
                                            <td>Comparisons against non-literals; fields named credential-shaped without equality comparison; <code>jwt.verify()</code> in a different file; test assertions.</td>
                                        </tr>
                                        <tr>
                                            <td><strong>HTML Hygiene</strong></td>
                                            <td>Missing viewport meta, missing alt text, literal inline <code>onclick="..."</code> attributes, missing CSP meta tag, non-trivial <code>&lt;script&gt;</code> blocks in HTML mode.</td>
                                            <td>Anything regarding JS/JSX inside the page.</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Dependency Hygiene</strong></td>
                                            <td>Unpinned version ranges (<code>*</code>, <code>latest</code>); git/URL/file dependency sources; suspicious script patterns (remote download piping); install lifecycle scripts; misplaced dev tools.</td>
                                            <td>Known CVE version lookup; missing lockfiles; unused dependencies.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* Unsupported Scope */}
                        {activeSection === 'unsupported' && (
                            <section id="unsupported" className="docs-card">
                                <h2>Unsupported Scope</h2>
                                <h3>Unsupported Vulnerability Classes</h3>
                                <p>
                                    Not implemented, and not claimed: general authentication/session-management analysis beyond the two narrow checks, ReDoS/algorithmic-complexity detection, CSRF, SSRF, prototype pollution, insecure deserialization, dependency/CVE scanning, general command injection beyond the narrow Node.js pattern, and anything requiring real type information or cross-function data-flow/taint tracking.
                                </p>

                                <h3>Unsupported Languages & Frameworks</h3>
                                <p>
                                    Do not assume support for: Vue, Svelte, Astro, Solid, Next.js-specific patterns, Node.js backend analysis beyond the narrow command-pattern rule, Tailwind security analysis, Web Components, or arbitrary "polyglot" code.
                                </p>
                            </section>
                        )}

                        {/* Local Execution & Privacy */}
                        {activeSection === 'local-exec' && (
                            <section id="local-exec" className="docs-card">
                                <h2>How Analysis Runs Locally</h2>
                                <ul style={{ color: '#333', lineHeight: 1.8, paddingLeft: '20px', marginBottom: '24px' }}>
                                    <li>Pasted/typed code is checked against a <strong>500KB size limit</strong> before anything else runs — oversized input is rejected with a message, not silently truncated.</li>
                                    <li>The code is sent (via <code>postMessage</code>, in-memory, same-origin) to a dedicated Web Worker. Parsing and rule execution happen there, off the UI thread.</li>
                                    <li>For HTML input, a lightweight attribute/text scan runs. For everything else, <code>@babel/parser</code> builds a real AST and each rule module traverses it independently.</li>
                                    <li>Findings are deduplicated by rule + source location and returned to the main thread.</li>
                                    <li>Nothing in this pipeline calls <code>fetch</code>, <code>XMLHttpRequest</code>, <code>WebSocket</code>, or any external SDK.</li>
                                </ul>

                                <h3>What Data is Stored Locally</h3>
                                <p>
                                    <strong>Nothing, by default.</strong> Nothing is written to <code>localStorage</code> unless "Save report summaries locally" is explicitly enabled. When enabled, only this is stored — never raw code, never a full secret value: timestamp, detected language, finding counts by severity, finding titles (not full snippets), and a masked excerpt of the input (first ~120 characters). This data is plaintext, not encrypted. A "Clear local data" button is available.
                                </p>
                            </section>
                        )}

                        {/* Report Export Formats */}
                        {activeSection === 'export' && (
                            <section id="export" className="docs-card">
                                <h2>Exporting a Report</h2>
                                <p>
                                    Three formats, all generated client-side from the exact findings already on screen:
                                </p>
                                <ul style={{ color: '#333', lineHeight: 1.8, paddingLeft: '20px' }}>
                                    <li><strong>PDF</strong>: A formatted report for sharing and archiving.</li>
                                    <li><strong>SARIF 2.1.0</strong>: The standard format GitHub Code Scanning, VS Code's SARIF viewer, and CI security tooling read — each rule's <code>helpUri</code> links to a real, stable anchor.</li>
                                    <li><strong>JSON</strong>: The full analysis result payload.</li>
                                </ul>
                            </section>
                        )}

                        {/* Scoring Removed */}
                        {activeSection === 'scoring-removed' && (
                            <section id="scoring-removed" className="docs-card">
                                <h2>Scoring Removed</h2>
                                <p>
                                    An earlier version of XAUDIT computed a weighted overall score, mapped it to a letter grade, and produced a ship/no-ship style verdict. This was removed entirely rather than kept in a "fixed" form, for three reasons:
                                </p>
                                <ol style={{ color: '#333', lineHeight: 1.8, paddingLeft: '20px' }}>
                                    <li><strong>No rubric could be made honest at this rule count:</strong> A grade implies a calibrated relationship between finding count/severity and actual security risk. With a handful of narrow rule groups and no data-flow analysis, that relationship doesn't exist.</li>
                                    <li><strong>It was empirically wrong on its own terms:</strong> The old scoring logic disagreed with its own author's hand-written test expectations on two of nine cases. A rubric that can't pass its own test cases has no business being presented as authoritative.</li>
                                    <li><strong>It invited exactly the wrong behavior:</strong> A grade or verdict is an invitation to treat a passing result as a decision rather than a prompt to keep looking. The replacement — a plain count of findings by severity, each with its own stated limitations — is deliberately less satisfying and more honest.</li>
                                </ol>
                            </section>
                        )}

                        {/* Limitations & Disclaimer */}
                        {activeSection === 'limitations' && (
                            <section id="limitations" className="docs-card">
                                <h2>Known Limitations & Security Disclaimer</h2>
                                <h3>Known Limitations</h3>
                                <ul style={{ color: '#333', lineHeight: 1.7, paddingLeft: '20px', marginBottom: '24px' }}>
                                    <li>No data-flow or taint analysis anywhere. Every rule looks at a direct AST relationship at a single call/assignment site.</li>
                                    <li>No type checker. TypeScript syntax parses, but type information is never used.</li>
                                    <li>The SQL-injection rule is deliberately narrow and will miss anything not shaped like one of its recognized method names on a recognized DB-shaped receiver.</li>
                                    <li>The secrets rule's entropy fallback will still miss a real secret that's hex-only or lands under its entropy threshold.</li>
                                    <li>No input-size streaming/chunking: input above 500KB is rejected outright.</li>
                                    <li>Old-style TypeScript angle-bracket casts (<code>&lt;Foo&gt;value</code>) do not parse — permanently ambiguous with JSX. Decorators, enums, private class fields, satisfies, and namespaces all parse correctly.</li>
                                    <li>PWA/offline behavior: the app shell is precached, but full offline functionality has not been independently verified across browsers.</li>
                                    <li>Security headers (CSP, HSTS, X-Frame-Options) are configured for Vercel deployment specifically. Hosting elsewhere gets none of this protection unless equivalent host-level configuration is added.</li>
                                    <li>Manually selecting "HTML" mode on non-HTML input does not analyze embedded <code>&lt;script&gt;</code> content and can return a clean, 0-finding result.</li>
                                    <li>The zero-network-request claim is verified manually before releases, not enforced by an automated CI test.</li>
                                    <li>This is a young rewrite. The rule set is intentionally small; "not flagged" means "not covered," not "checked and clean."</li>
                                </ul>

                                <div className="docs-callout danger">
                                    <strong>Security Disclaimer:</strong> XAUDIT is a supplementary, best-effort static pattern-checker. It is not a substitute for a professional security review, threat modeling, dependency/SCA scanning, penetration testing, or a secure development lifecycle. A clean XAUDIT result does not mean your code is secure, and a reported finding does not by itself mean your code is exploitable.
                                </div>
                            </section>
                        )}

                        {/* Architecture */}
                        {activeSection === 'architecture' && (
                            <section id="architecture" className="docs-card">
                                <h2>Architecture & Parser Selection</h2>
                                <div className="docs-code-block">
{`User pasted/uploaded text
  → file-size & type validation            (500KB hard cap, rejected outright)
  → Web Worker
  → parser selected by mode                 (html attribute scan OR @babel/parser AST)
  → AST traversal / narrowly scoped rules
  → normalized Finding objects
  → deduplication
  → result UI
  → optional local-only report persistence  (off by default)`}
                                </div>

                                <h3>Parser Choice</h3>
                                <p>
                                    <code>@babel/parser</code> + <code>@babel/traverse</code> was chosen over <code>@typescript-eslint/typescript-estree</code> (pulls in full TS compiler — large, Node/CLI-oriented) and <code>acorn</code> (fast for JS/JSX, but bolted-on TS plugin). Babel provides a single parser accepting the union of JS/TS/JSX/TSX syntax with a mature, uniform visitor API. It does not include a type checker — a deliberate scope limit, not an oversight.
                                </p>

                                <h3>Web Worker Isolation</h3>
                                <p>
                                    A single worker is spawned and communicated with over <code>postMessage</code>. Every request carries an incrementing <code>requestId</code>; the client discards any response whose ID doesn't match the most recent. Babel's synchronous calls do not yield, but given the 500KB cap, worst-case analysis time stays low enough that this tradeoff was accepted.
                                </p>
                            </section>
                        )}

                        {/* Pre-Rewrite Baseline Audit */}
                        {activeSection === 'baseline' && (
                            <section id="baseline" className="docs-card">
                                <h2>Baseline Audit (Pre-Rewrite)</h2>
                                <p>
                                    Recorded before any rewrite work, as ground truth measured against source code, local runs, production builds, and a 30-case adversarial script run:
                                </p>
                                <ul style={{ color: '#333', lineHeight: 1.7, paddingLeft: '20px' }}>
                                    <li>Pure regex/string matching engine. No parser, no AST, no data-flow tracking, no AI model.</li>
                                    <li>SQLi detector was unreachable dead code after an unconditional early return.</li>
                                    <li>Standard React JSX (<code>onClick=&#123;handleClick&#125;</code>) reported as critical inline click handler vulnerability.</li>
                                    <li>Raw DOM XSS (<code>element.innerHTML = userInput</code>) computed a flag internally but never created a finding.</li>
                                    <li>Secret scanner mislabeled real keys as multiple unrelated vendor keys.</li>
                                    <li>PDF library had unpatched critical/high security advisories.</li>
                                    <li>No CSP or security headers anywhere.</li>
                                    <li>External font requests contradicted "0 KB uploaded" claim.</li>
                                    <li>Local storage was plaintext despite on-page "encrypted" claim.</li>
                                    <li>30-case adversarial corpus baseline: <strong>Precision = 0.64, Recall = 0.41, F1 = 0.50</strong>.</li>
                                </ul>
                            </section>
                        )}

                        {/* Model Improvements Log */}
                        {activeSection === 'improvements' && (
                            <section id="improvements" className="docs-card">
                                <h2>Model Improvements Log</h2>
                                <p>Plain-language record of changes to the detection engine:</p>
                                <ul style={{ color: '#333', lineHeight: 1.7, paddingLeft: '20px' }}>
                                    <li><strong>Same-scope variable tracing:</strong> Traces Plain variables back one hop to initial declaration. Cuts false positives on safe HTML literals & catches indirect SQLi.</li>
                                    <li><strong>Reverted dynamic import()/require() check:</strong> Reverted same day after testing showed high false positives on locale/route code-splitting.</li>
                                    <li><strong>Expanded ORM coverage:</strong> Added <code>sequelize</code>, <code>dataSource</code>, <code>queryRunner</code>, and Prisma unsafe raw-query methods.</li>
                                    <li><strong>Entropy-based secrets fallback:</strong> Shannon entropy threshold ≥ 4.5 bits/char calibrated against real tokens vs git hashes, UUIDs, SRI hashes, CDN URLs.</li>
                                    <li><strong>Fixed dangerouslySetInnerHTML as variable:</strong> Resolved gap where props object built separately as a variable bypassed object-literal check.</li>
                                    <li><strong>Independent benchmark corpus:</strong> Built 14 multi-concern benchmark files. Result: <strong>14 files, 13 true positives, 0 false positives, 0 false negatives</strong>.</li>
                                    <li><strong>Fixed Decorator TS parsing:</strong> Added Babel <code>decorators-legacy</code> plugin enabling NestJS, Angular, and TypeORM controller parsing.</li>
                                    <li><strong>New Sink — jQuery .html():</strong> Added receiver-validated check for jQuery/jqLite <code>.html()</code> DOM injection.</li>
                                    <li><strong>Weak Authentication rules:</strong> Hardcoded credential equality checks & <code>jwt.decode()</code> without <code>jwt.verify()</code> in same file.</li>
                                    <li><strong>Pathological slowdown testing:</strong> Verified adversarial backreferences, 7,500+ findings, 20,000 deep nested arrays run in sub-second time without ReDoS.</li>
                                </ul>
                            </section>
                        )}

                        {/* Self-Audit */}
                        {activeSection === 'self-audit' && (
                            <section id="self-audit" className="docs-card">
                                <h2>Self-Audit — 2026-09-03</h2>
                                <div className="docs-callout warning">
                                    <strong>Executive Verdict:</strong> An early usable developer tool with limited verified coverage. A real, narrow, AST-based static checker — not an AI product, not a security guarantee.
                                </div>

                                <table className="docs-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Severity</th>
                                            <th>Finding Summary & Resolution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><code>F-01</code></td>
                                            <td><span className="docs-badge critical">Critical</span></td>
                                            <td>Non-vendor high-entropy secret leaked unmasked into local storage history. Fixed during audit with a matching redaction pass before storage writes.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-02</code></td>
                                            <td><span className="docs-badge medium">Medium</span></td>
                                            <td>Two landing page sections stated conflicting rule-group counts. Fixed same day to single consistent count.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-03</code></td>
                                            <td><span className="docs-badge medium">Medium</span></td>
                                            <td>Security headers were Vercel-platform-specific without disclosure. Fixed same day in deployment docs.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-04</code></td>
                                            <td><span className="docs-badge low">Low</span></td>
                                            <td>"Send to coding assistant" button only copied text to clipboard. Fixed UI text to describe actual clipboard operation.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-05</code></td>
                                            <td><span className="docs-badge low">Low</span></td>
                                            <td>Manual HTML mode override on non-HTML input returned clean zero-finding result. Fixed by adding informational disclosure finding.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-06</code></td>
                                            <td><span className="docs-badge info">Info</span></td>
                                            <td>Zero-network request claim lacked automated regression test. Closed with unit tests, traps, and Playwright end-to-end network & console guards.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* Exhaustive Rule Reference */}
                        {activeSection === 'rules-reference' && (
                            <section id="rules-reference" className="docs-card">
                                <h2>Exhaustive Rule Reference</h2>
                                <p>
                                    41 active documented rule IDs across 8 rule modules:
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '16px' }}>
                                    {[
                                        'xss-inner-html', 'xss-outer-html', 'xss-iframe-srcdoc', 'xss-insert-adjacent-html', 'xss-document-write', 'xss-document-writeln', 'xss-dangerously-set-inner-html', 'xss-jquery-html', 'xss-location-javascript-uri', 'xss-setattribute-javascript-uri', 'xss-jsx-href-javascript-uri',
                                        'sqli-dynamic-query',
                                        'secret-openai', 'secret-anthropic', 'secret-stripe', 'secret-aws', 'secret-github', 'secret-gitlab', 'secret-slack', 'secret-pem-key', 'secret-google-api', 'secret-generic-assignment', 'secret-high-entropy-string',
                                        'exec-eval', 'exec-function-ctor', 'exec-set-timeout-string', 'exec-set-interval-string',
                                        'node-command-exec-dynamic', 'node-command-spawn-shell',
                                        'auth-hardcoded-credential-comparison', 'auth-jwt-decode-without-verify',
                                        'dep-unpinned-version', 'dep-non-registry-source', 'dep-suspicious-script-content', 'dep-lifecycle-script-present', 'dep-devtool-in-dependencies',
                                        'html-missing-viewport', 'html-missing-alt', 'html-inline-event-handler', 'html-missing-csp-meta', 'html-script-content-not-analyzed'
                                    ].map((id) => (
                                        <div key={id} style={{ padding: '10px 14px', borderRadius: '12px', background: '#0d0d0d', border: '1px solid var(--line)', fontFamily: 'monospace', fontSize: '12px', color: '#eee' }}>
                                            {id}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                <footer style={{ marginTop: '80px' }}>
                    <div className="footer-cta">
                        <h2>Audit the claim before you trust the result.</h2>
                        <button className="cta dark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <span>↑</span> Top of Documentation
                        </button>
                    </div>
                    <div className="footer-bottom">
                        <span>XAUDIT</span>
                        <span>Client-side static checker · no network audit path</span>
                        <span>PDF / SARIF / JSON</span>
                    </div>
                </footer>
                </div>
            </main>
        </div>
    );
}
