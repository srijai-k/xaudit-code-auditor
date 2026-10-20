import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import '../landing.css';

const SECTIONS = [
    { id: 'overview', title: 'Overview' },
    { id: 'checks', title: 'What it checks' },
    { id: 'unsupported', title: 'What it doesn\'t cover' },
    { id: 'local-exec', title: 'Privacy and local running' },
    { id: 'export', title: 'Export formats' },
    { id: 'scoring-removed', title: 'Scoring Removed' },
    { id: 'limitations', title: 'Limitations' },
    { id: 'architecture', title: 'Architecture' },
    { id: 'baseline', title: 'What the old version got wrong' },
    { id: 'improvements', title: 'Engine changelog' },
    { id: 'self-audit', title: 'Self-Audit (2026-09-03)' },
    { id: 'rules-reference', title: 'Every rule ID' },
];

export default function DocsPage() {
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
                        Docs
                    </div>
                    <h1 style={{ fontSize: '42px', fontWeight: 500, color: '#111', margin: '10px 0 16px', lineHeight: 1.15 }}>
                        The long version.
                    </h1>
                    <p style={{ color: '#555', fontSize: '16px', lineHeight: 1.6 }}>
                        What every rule checks, what it skips, how the engine is built and every bug I found in my own code. The other pages are the short version.
                    </p>
                </div>

                <div className="docs-layout">
                    {/* Sticky Sidebar Tab Navigation */}
                    <aside className="docs-sidebar">
                        <div className="docs-nav-title">ON THIS PAGE</div>
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
                                    XAUDIT is a code checker that runs in your browser. It reads JavaScript, TypeScript, React/JSX and HTML with a real parser (<code>@babel/parser</code>), reads package.json as JSON, and runs a small set of rules I wrote and tested by hand. All of it happens in a Web Worker. There's no AI model in it, and it isn't just searching text with regex.
                                </p>
                                <div className="docs-callout warning">
                                    <strong>Worth saying up front:</strong> everything XAUDIT reports needs a human to look at it. A clean result doesn't mean your code is secure.
                                </div>
                                <p>
                                    This is a rewrite. The first version of this project called itself "AI-powered" and "enterprise-grade," said it ran on WebAssembly, promised zero false positives and claimed to support a dozen frameworks. The code behind it couldn't back any of that up. This version tries to only say things there's a test for.
                                </p>
                            </section>
                        )}

                        {/* Current Supported Checks */}
                        {activeSection === 'checks' && (
                            <section id="checks" className="docs-card">
                                <h2>What it checks</h2>
                                <p>
                                    Only JavaScript, TypeScript, React/JSX, basic HTML and package.json get checked. Every finding comes with what matched, why it matters, a safer example and what the rule can't see. There's no grade or score. I took that out on purpose (see <em>Scoring Removed</em>).
                                </p>

                                <table className="docs-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '22%' }}>Rule group</th>
                                            <th style={{ width: '40%' }}>What it flags</th>
                                            <th style={{ width: '38%' }}>What it leaves alone on purpose</th>
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
                                            <td>Missing viewport meta, missing alt text, literal inline <code>onclick="..."</code> attributes, missing CSP meta tag. Inline <code>&lt;script&gt;</code> blocks also get run through the JavaScript rules.</td>
                                            <td>External <code>&lt;script src&gt;</code> files, and script blocks that can't be parsed on their own (those get a note saying they weren't checked).</td>
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
                                <h2>What it doesn't cover</h2>
                                <h3>Vulnerabilities it doesn't look for</h3>
                                <p>
                                    XAUDIT doesn't check for general authentication/session-management analysis beyond the two narrow checks, ReDoS/algorithmic-complexity detection, CSRF, SSRF, prototype pollution, insecure deserialization, dependency/CVE scanning, general command injection beyond the narrow Node.js pattern, and anything requiring real type information or cross-function data-flow/taint tracking.
                                </p>

                                <h3>Languages and frameworks it doesn't support</h3>
                                <p>
                                    Don't expect results for Vue, Svelte, Astro, Solid, Next.js-specific patterns, Node.js backend analysis beyond the narrow command-pattern rule, Tailwind security analysis, Web Components, or arbitrary "polyglot" code.
                                </p>
                            </section>
                        )}

                        {/* Local Execution & Privacy */}
                        {activeSection === 'local-exec' && (
                            <section id="local-exec" className="docs-card">
                                <h2>How it runs on your machine</h2>
                                <ul style={{ color: '#333', lineHeight: 1.8, paddingLeft: '20px', marginBottom: '24px' }}>
                                    <li>Pasted/typed code is checked against a <strong>500KB size limit</strong> before anything else runs. Anything bigger is rejected with a message instead of being cut short.</li>
                                    <li>The code is sent (via <code>postMessage</code>, in-memory, same-origin) to a dedicated Web Worker. Parsing and rule execution happen there, off the UI thread.</li>
                                    <li>For HTML input, a lightweight attribute/text scan runs. For everything else, <code>@babel/parser</code> builds a real AST and each rule module traverses it independently.</li>
                                    <li>Findings are deduplicated by rule + source location and returned to the main thread.</li>
                                    <li>Nothing in this pipeline calls <code>fetch</code>, <code>XMLHttpRequest</code>, <code>WebSocket</code>, or any external SDK.</li>
                                </ul>

                                <h3>What gets saved</h3>
                                <p>
                                    <strong>Nothing, by default.</strong> Nothing is written to <code>localStorage</code> unless you turn on "Save local report summaries". If you do, this is all that gets stored. Never your full code and never a full secret: timestamp, detected language, finding counts by severity, finding titles (not full snippets), and a masked excerpt of the input (first ~120 characters). This data is plaintext, not encrypted. A "Clear local data" button is available.
                                </p>
                            </section>
                        )}

                        {/* Report Export Formats */}
                        {activeSection === 'export' && (
                            <section id="export" className="docs-card">
                                <h2>Export formats</h2>
                                <p>
                                    Three formats, all made in your browser from the findings already on screen:
                                </p>
                                <ul style={{ color: '#333', lineHeight: 1.8, paddingLeft: '20px' }}>
                                    <li><strong>PDF</strong>: A formatted report for sharing and archiving.</li>
                                    <li><strong>SARIF 2.1.0</strong>: The standard format GitHub Code Scanning, VS Code's SARIF viewer, and most CI tools already read. Each rule's <code>helpUri</code> links to its own section in the docs.</li>
                                    <li><strong>JSON</strong>: The whole result, plus the on-screen disclaimer.</li>
                                </ul>
                            </section>
                        )}

                        {/* Scoring Removed */}
                        {activeSection === 'scoring-removed' && (
                            <section id="scoring-removed" className="docs-card">
                                <h2>Scoring Removed</h2>
                                <p>
                                    An earlier version of XAUDIT gave your code a weighted score, turned it into a letter grade and told you whether to ship. I took all of it out. Here's why:
                                </p>
                                <ol style={{ color: '#333', lineHeight: 1.8, paddingLeft: '20px' }}>
                                    <li><strong>The grade didn't mean anything.</strong> For a grade to be fair, the number of findings would have to say something real about how risky the code is. With a handful of narrow rules and no data-flow tracking, it just doesn't.</li>
                                    <li><strong>It failed its own tests.</strong> The scoring disagreed with my own hand-written expectations on two out of nine test cases. Hard to trust a grade that can't pass its own quiz.</li>
                                    <li><strong>People stop at an A.</strong> You see an A, you close the tab. What's there now is a plain count of findings by severity, each with its own limits listed. It's less satisfying to look at, which is kind of the point.</li>
                                </ol>
                            </section>
                        )}

                        {/* Limitations & Disclaimer */}
                        {activeSection === 'limitations' && (
                            <section id="limitations" className="docs-card">
                                <h2>Limitations</h2>
                                <h3>Things it can't do</h3>
                                <ul style={{ color: '#333', lineHeight: 1.7, paddingLeft: '20px', marginBottom: '24px' }}>
                                    <li>No data-flow or taint analysis anywhere. Every rule looks at a direct AST relationship at a single call/assignment site.</li>
                                    <li>No type checker. TypeScript syntax parses, but type information is never used.</li>
                                    <li>The SQL-injection rule is deliberately narrow and will miss anything not shaped like one of its recognized method names on a recognized DB-shaped receiver.</li>
                                    <li>The secrets rule's entropy fallback will still miss a real secret that's hex-only or lands under its entropy threshold.</li>
                                    <li>No input-size streaming/chunking: input above 500KB is rejected outright.</li>
                                    <li>Old-style TypeScript angle-bracket casts (<code>&lt;Foo&gt;value</code>) don't parse, because with JSX turned on they look exactly like a tag. Use <code>value as Foo</code> instead. Decorators, enums, private class fields, satisfies, and namespaces all parse correctly.</li>
                                    <li>PWA/offline behavior: the app shell is precached, but full offline functionality has not been independently verified across browsers.</li>
                                    <li>Security headers (CSP, HSTS, X-Frame-Options) are configured for Vercel deployment specifically. Hosting elsewhere gets none of this protection unless equivalent host-level configuration is added.</li>
                                    <li>If you pick HTML mode and paste plain JavaScript, the JavaScript rules still don't run on it. You get a note saying so instead of a clean result. Auto-detect doesn't have this problem.</li>
                                    <li>The zero-network claim is checked in CI two ways: a Playwright test that watches every request during a real click-through, and a check that fails the build if <code>fetch</code>, <code>XMLHttpRequest</code> or <code>WebSocket</code> shows up anywhere in the source.</li>
                                    <li>This is a young rewrite and the rule set is small on purpose. If something isn't flagged, it might just not be covered.</li>
                                </ul>

                                <div className="docs-callout danger">
                                    <strong>The disclaimer:</strong> XAUDIT is a supplementary, best-effort static pattern-checker. It is not a substitute for a professional security review, threat modeling, dependency/SCA scanning, penetration testing, or a secure development lifecycle. A clean XAUDIT result does not mean your code is secure, and a reported finding does not by itself mean your code is exploitable.
                                </div>
                            </section>
                        )}

                        {/* Architecture */}
                        {activeSection === 'architecture' && (
                            <section id="architecture" className="docs-card">
                                <h2>Architecture</h2>
                                <div className="docs-code-block">
{`User pasted/uploaded text
  → file-size & type validation            (over 500KB? rejected)
  → Web Worker
  → parser selected by mode                 (HTML scan or @babel/parser AST)
  → AST traversal / narrowly scoped rules
  → normalized Finding objects
  → deduplication
  → result UI
  → optional local-only report persistence  (off by default)`}
                                </div>

                                <h3>Why Babel</h3>
                                <p>
                                    I went with <code>@babel/parser</code> and <code>@babel/traverse</code>. <code>@typescript-eslint/typescript-estree</code> pulls in the whole TypeScript compiler, which is big and built for Node. <code>acorn</code> is fast for JS and JSX, but TypeScript is a plugin bolted onto it. Babel reads JS, TS, JSX and TSX with one parser and one way of walking the tree. There's no type checker, and that's on purpose.
                                </p>

                                <h3>The Web Worker</h3>
                                <p>
                                    There's one worker, and the page talks to it over <code>postMessage</code>. Every request gets a <code>requestId</code> that goes up by one each time. If an answer comes back with an old ID, it gets ignored. Babel can't be paused halfway through a parse, but with the 500KB cap even the worst case finishes fast, so I left it like that.
                                </p>
                            </section>
                        )}

                        {/* Pre-Rewrite Baseline Audit */}
                        {activeSection === 'baseline' && (
                            <section id="baseline" className="docs-card">
                                <h2>What the old version got wrong</h2>
                                <p>
                                    Before rewriting anything, I went through the old version and wrote down what was actually true. I checked the source, ran it locally, built it for production and threw 30 tricky test cases at it:
                                </p>
                                <ul style={{ color: '#333', lineHeight: 1.7, paddingLeft: '20px' }}>
                                    <li>It was all regex and string matching. No parser and no AI model, even though the site said "AI-powered."</li>
                                    <li>The SQL injection detector never ran. It sat after a <code>return</code> that always fired.</li>
                                    <li>A normal React <code>onClick=&#123;handleClick&#125;</code> got flagged as a critical vulnerability.</li>
                                    <li><code>element.innerHTML = userInput</code>, the most classic XSS there is, got noticed internally and then never reported.</li>
                                    <li>The secret scanner labeled one real key as several different vendors' keys at once.</li>
                                    <li>The PDF library had known critical and high security advisories that were never patched.</li>
                                    <li>No CSP or security headers anywhere.</li>
                                    <li>It loaded fonts from an outside server while saying "0 KB uploaded."</li>
                                    <li>The site said local storage was encrypted. It was plain text.</li>
                                    <li>Score on the 30 tricky cases: <strong>Precision = 0.64, Recall = 0.41, F1 = 0.50</strong>.</li>
                                </ul>
                            </section>
                        )}

                        {/* Model Improvements Log */}
                        {activeSection === 'improvements' && (
                            <section id="improvements" className="docs-card">
                                <h2>Engine changelog</h2>
                                <p>Every real change to how detection works, in the order it happened:</p>
                                <ul style={{ color: '#333', lineHeight: 1.7, paddingLeft: '20px' }}>
                                    <li><strong>Same-scope variable tracing:</strong> Follows a plain variable back one step to where it was declared. Fewer false alarms on safe HTML strings, and it catches SQL that was built one line earlier.</li>
                                    <li><strong>Reverted dynamic import()/require() check:</strong> Undone the same day. It flagged normal code-splitting for languages and routes way too often.</li>
                                    <li><strong>Expanded ORM coverage:</strong> Added <code>sequelize</code>, <code>dataSource</code>, <code>queryRunner</code>, and Prisma unsafe raw-query methods.</li>
                                    <li><strong>Entropy-based secrets fallback:</strong> Catches random-looking strings above 4.5 bits of entropy per character. Tuned against real tokens so git hashes, UUIDs, SRI hashes and CDN URLs don't set it off.</li>
                                    <li><strong>Fixed dangerouslySetInnerHTML as variable:</strong> If the <code>&#123; __html &#125;</code> object was built in a separate variable first, it used to slip past. Not anymore.</li>
                                    <li><strong>Separate benchmark files:</strong> Realistic files with a few things going on in each, with expected results written down first. Now <strong>21 files, 22 found, 0 false alarms, 0 missed</strong>. I wrote these too, so take that with some salt.</li>
                                    <li><strong>Fixed Decorator TS parsing:</strong> Turned on Babel's <code>decorators-legacy</code> plugin, so NestJS, Angular and TypeORM code parses now.</li>
                                    <li><strong>New check, jQuery .html():</strong> Flags <code>.html()</code>, but only when it's called on something that really looks like jQuery.</li>
                                    <li><strong>Weak Authentication rules:</strong> Passwords compared against a hardcoded string, and <code>jwt.decode()</code> with no <code>jwt.verify()</code> in the same file.</li>
                                    <li><strong>Pathological slowdown testing:</strong> Threw nasty inputs at it on purpose: regex-breaking strings, files with 7,500+ findings, arrays nested 20,000 deep. All of them finish in under a second.</li>
                                </ul>
                            </section>
                        )}

                        {/* Self-Audit */}
                        {activeSection === 'self-audit' && (
                            <section id="self-audit" className="docs-card">
                                <h2>Self-audit, 2026-09-03</h2>
                                <div className="docs-callout warning">
                                    <strong>Short version:</strong> it's an early tool that works, with a small set of checks I can actually back up. Useful for finding where to look. It won't tell you your code is safe.
                                </div>

                                <table className="docs-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Severity</th>
                                            <th>What I found and what I did about it</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><code>F-01</code></td>
                                            <td><span className="docs-badge critical">Critical</span></td>
                                            <td>A random-looking secret with no known format was getting saved to history unmasked. Fixed during the audit: everything goes through the same masking step before it's saved now.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-02</code></td>
                                            <td><span className="docs-badge medium">Medium</span></td>
                                            <td>Two sections of the landing page disagreed on how many rule groups there were. Fixed the same day.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-03</code></td>
                                            <td><span className="docs-badge medium">Medium</span></td>
                                            <td>The security headers only work on Vercel and nothing said so. Added to the deployment docs the same day.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-04</code></td>
                                            <td><span className="docs-badge low">Low</span></td>
                                            <td>A button said "Send to coding assistant" but it only copied text. Renamed it to say what it actually does.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-05</code></td>
                                            <td><span className="docs-badge low">Low</span></td>
                                            <td>Picking HTML mode for non-HTML input gave a clean zero-finding result. Fixed: input with no HTML in it now gets a note saying the JavaScript rules didn't run, and script blocks that can't be parsed get one too.</td>
                                        </tr>
                                        <tr>
                                            <td><code>F-06</code></td>
                                            <td><span className="docs-badge info">Info</span></td>
                                            <td>Nothing automatically checked the zero-network claim. Now unit tests and a Playwright run both fail if anything tries to reach the network.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* Exhaustive Rule Reference */}
                        {activeSection === 'rules-reference' && (
                            <section id="rules-reference" className="docs-card">
                                <h2>Every rule ID</h2>
                                <p>
                                    41 rule IDs across 8 rule modules. Each one has its own page in <code>docs/rules/</code>:
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
                                        'html-missing-viewport', 'html-missing-alt', 'html-inline-event-handler', 'html-missing-csp-meta', 'html-script-content-not-analyzed', 'html-input-not-html'
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
                        <h2>Paste some code and see what it finds.</h2>
                        <button className="cta dark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <span>↑</span> Top of Documentation
                        </button>
                    </div>
                    <div className="footer-bottom">
                        <span>XAUDIT</span>
                        <span>Runs in your browser · nothing uploaded</span>
                        <span>PDF / SARIF / JSON</span>
                    </div>
                </footer>
                </div>
            </main>
        </div>
    );
}
