import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import '../landing.css';

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10.5l3.5 3.5L16 6" stroke="var(--lav)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h12M10.5 4.5L15 9l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStartAudit = (e) => {
    e?.preventDefault();
    navigate('/check');
  };

  const [expandedCard, setExpandedCard] = useState(null);

  const toggleExpandCard = (index, e) => {
    e?.preventDefault();
    setExpandedCard(expandedCard === index ? null : index);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in");
      });
    }, { threshold: 0.14 });

    document.querySelectorAll(".reveal").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.replace('#', '');
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 120);
      }
    };

    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

  return (
    <div className="landing-wrapper">
      <TopTicker />
      <main className="page-shell">
        <HeaderNav />

        <div className="page-shell-body">
        <section className="hero reveal">
          {/* -50px was picked live via a temporary dev control (removed) that
              nudged this block up/down; hardcoded here the same way
              FLOATING_NAV_TOP/RIGHT were. Moved from an inline style to the
              .hero-inner class (landing.css) so it can be overridden on
              mobile — see that rule's comment for why: the -50px was tuned
              against desktop's 68px .hero top padding, but mobile's .hero
              padding drops to 30px, so -50px pulled this block up far
              enough to sit underneath the header during the page-load
              blur-in transition. */}
          <div className="hero-inner">
            <p className="eyebrow purple"><span></span>For code you didn't write line by line</p>
            <h1>Check the code your AI wrote before it goes anywhere.</h1>
            <p className="hero-copy">Paste what ChatGPT, Claude or Copilot gave you. XAUDIT points at the parts worth a second look, right in your browser, and nothing gets uploaded. It doesn't promise your code is secure. It just tells you where to look.</p>
            <div className="hero-actions">
              <button className="cta primary-audit-cta" onClick={handleStartAudit}>
                <span>+</span> Start Audit
              </button>
            </div>
          </div>
        </section>

        <section className="showpiece reveal" aria-label="XAUDIT interface preview">
          <div className="shape-notch top"></div>
          <div className="audit-ui">
            <div className="audit-window">
              <div className="window-bar"><span></span><span></span><span></span><b>greeting.js</b></div>
              <pre><code>{`const name = params.get("name");

greeting.innerHTML =
  "Hi " + name;`}</code></pre>
            </div>
            <div className="finding-card">
              <p>XSS · high</p>
              <h3>Unsanitized assignment to .innerHTML</h3>
              <span>Why it matters</span>
              <small>If name comes from a URL, anyone can run their own script on your page. textContent is the boring fix.</small>
            </div>
          </div>
          <div className="shape-notch bottom"></div>
        </section>

        <section className="logos" aria-label="Core formats">
          <div className="logo-track text-track">
            <span>JavaScript</span><span>TypeScript</span><span>React/JSX</span><span>HTML</span><span>package.json</span><span>SARIF 2.1.0</span>
            <span>JavaScript</span><span>TypeScript</span><span>React/JSX</span><span>HTML</span><span>package.json</span><span>SARIF 2.1.0</span>
          </div>
        </section>

        {/* DRAFT - Srijai: this is written from the repo history (the old
            version's claims and docs/baseline-audit.md). Rewrite it in your
            own words and fix anything that isn't how it actually happened. */}
        <section id="story" className="origin reveal">
          <div>
            <p className="eyebrow purple"><span></span>Why I made this</p>
            <h2>The first version of XAUDIT was written mostly by AI, and it was very happy with itself.</h2>
          </div>
          <div className="origin-body">
            <p>It said it was AI-powered. It said it had zero false positives. I believed it for a while.</p>
            <p>Then I actually tested it. I expected to find a needle in a haystack. It was more like finding hay in a stack of needles. The SQL injection check never ran. The most common XSS bug got noticed and then never reported. The storage it called encrypted was plain text.</p>
            <p>So I started over. This version only says what I can back up with a test.</p>
            <button className="cta" onClick={() => navigate('/docs')}>
              <span>+</span> What the old version got wrong
            </button>
          </div>
        </section>

        <section id="testimonials" className="quote-spotlight reveal">
          <p className="eyebrow purple"><span></span>What people said</p>
          <blockquote>“What I liked most was that XAUDIT <em>does not try to solve everything at once.</em>”</blockquote>
          <div className="quote-spotlight-foot">
            <div className="quote-spotlight-names">
              <img className="quote-spotlight-face" src="/testimonials/oliver-wesche.webp" alt="" draggable={false} decoding="async" />
              <b>Oliver Wesche · Harvard University alum</b>
              <span>+ five more alumni of Carnegie Mellon University and the University of North Carolina at Chapel Hill</span>
            </div>
            <button className="cta" onClick={() => navigate('/testimonials')}>
              <span>+</span> Read all six
            </button>
          </div>
        </section>

        <section id="loop" className="loop reveal">
          <p className="eyebrow purple"><span></span>Fits into how you already code</p>
          <h2>Your AI writes it, XAUDIT reads it, and the fix goes straight back to your AI.</h2>
          <ol className="loop-grid">
            <li><b>01</b><h3>Ask your AI</h3><p>Get the code from ChatGPT, Claude, Copilot, Cursor or v0, same as always.</p></li>
            <li><b>02</b><h3>Paste it here</h3><p>XAUDIT reads it in your browser and points at anything risky. Nothing leaves the tab.</p></li>
            <li><b>03</b><h3>Copy the prompt</h3><p>Every finding comes with a ready-made prompt for Cursor, Claude, ChatGPT or v0 that explains the problem and asks for a fix.</p></li>
            <li><b>04</b><h3>Check the fix</h3><p>Paste your AI's new version back in. XAUDIT tells you what actually got fixed, what's still there, and anything new it broke.</p></li>
          </ol>
          <button className="cta" onClick={() => navigate('/check')}><span>+</span> Try it with a sample</button>
        </section>

        <section id="vs-ai" className="versus reveal">
          <p className="eyebrow purple"><span></span>Why not just ask your AI?</p>
          <h2>Sometimes you should. It just shouldn't be the one grading its own homework.</h2>
          <div className="versus-table" role="table" aria-label="XAUDIT compared with asking an AI chatbot">
            <div className="versus-row versus-head" role="row">
              <span role="columnheader"></span>
              <span role="columnheader">XAUDIT</span>
              <span role="columnheader">Asking an AI</span>
            </div>
            {[
              ['Same code, same answer', 'Every time', 'Can change between tries'],
              ['Checks whether a fix actually worked', 'Compares before and after', 'Tends to say it did'],
              ['Where your code goes', 'Nowhere. It stays in this tab', "To the AI company's servers"],
              ['Tells you what it didn\'t check', 'On every finding', 'Rarely'],
              ['How many kinds of problems it knows', 'A short, tested list', 'Far more'],
              ['Understands what your app is for', 'No', 'Often'],
              ['Explains anything you ask about', 'Only its own findings', 'Yes'],
            ].map(([label, x, ai]) => (
              <div className="versus-row" role="row" key={label}>
                <span role="rowheader">{label}</span>
                <span role="cell">{x}</span>
                <span role="cell">{ai}</span>
              </div>
            ))}
          </div>
          <p className="versus-foot">So use both. Let your AI write it and explain it. Let XAUDIT check it, including the fix.</p>
        </section>

        <section id="engine" className="services reveal">
          <p className="eyebrow purple"><span></span>How it works</p>
          <h2>It actually reads your code first. Then it checks it against a short list of known mistakes.</h2>
          <div className="service-grid">
            <article className={expandedCard === 0 ? 'is-expanded' : expandedCard !== null ? 'is-shrunk' : ''}>
              <h3>Stays in your tab</h3>
              <p>Everything runs in a Web Worker inside your browser tab. Your code doesn't go anywhere, so there's nothing to leak.</p>
              <div className={`analysis-expand-wrapper ${expandedCard === 0 ? 'is-open' : ''}`}>
                <div className="analysis-expand-inner">
                  <p>There's one worker, and the page talks to it with <code>postMessage</code>. Every scan gets a number. If you paste something new before the last scan finishes, the old answer gets thrown out when it shows up, so you never see results for code that isn't on screen anymore.</p>
                </div>
              </div>
              <button
                className="expand-card-btn"
                onClick={(e) => toggleExpandCard(0, e)}
                aria-label="Expand Stays in your tab card"
                title={expandedCard === 0 ? "Collapse card" : "Expand card"}
              >
                <ArrowIcon />
              </button>
            </article>
            <article className={expandedCard === 1 ? 'is-expanded' : expandedCard !== null ? 'is-shrunk' : ''}>
              <h3>Real parsing</h3>
              <p>Your code gets turned into a syntax tree by Babel, the same parser half the build tools out there use. HTML gets a simpler scan.</p>
              <div className={`analysis-expand-wrapper ${expandedCard === 1 ? 'is-open' : ''}`}>
                <div className="analysis-expand-inner">
                  <p>I went with <code>@babel/parser</code> because one parser handles JavaScript, TypeScript and JSX at once. <code>typescript-estree</code> drags the whole TypeScript compiler along with it, and <code>acorn</code>'s TypeScript support felt taped on. There's no type checker, so XAUDIT never knows what type a variable really is. It only sees the shape of the code.</p>
                </div>
              </div>
              <button
                className="expand-card-btn"
                onClick={(e) => toggleExpandCard(1, e)}
                aria-label="Expand Real parsing card"
                title={expandedCard === 1 ? "Collapse card" : "Expand card"}
              >
                <ArrowIcon />
              </button>
            </article>
            <article className={expandedCard === 2 ? 'is-expanded' : expandedCard !== null ? 'is-shrunk' : ''}>
              <h3>500KB max</h3>
              <p>Anything bigger gets turned away. If the same problem shows up twice in the same spot, you see it once.</p>
              <div className={`analysis-expand-wrapper ${expandedCard === 2 ? 'is-open' : ''}`}>
                <div className="analysis-expand-inner">
                  <p>A big file gets rejected with a message. It doesn't get quietly cut in half and checked anyway, because then the report would look complete when it isn't. Duplicates get merged by rule and location, so one bad line inside a loop shows up once instead of ten times.</p>
                </div>
              </div>
              <button
                className="expand-card-btn"
                onClick={(e) => toggleExpandCard(2, e)}
                aria-label="Expand 500KB max card"
                title={expandedCard === 2 ? "Collapse card" : "Expand card"}
              >
                <ArrowIcon />
              </button>
            </article>
          </div>
          <button className="cta" onClick={() => navigate('/engine')}><span>+</span> How the engine works</button>
        </section>

        <section id="privacy" className="vision reveal">
          <div>
            <p className="eyebrow red"><span></span>Privacy</p>
            <h2>Your code stays on your computer.</h2>
            <p>XAUDIT saves nothing unless you turn on history. Even then it only keeps the counts, the finding titles and the first 120 or so characters of your code, with secrets masked out. It sits in plain localStorage, so it isn't encrypted. There's just not much there.</p>
            <button className="cta" style={{ marginTop: '28px' }} onClick={() => navigate('/privacy')}>
              <span>+</span> How privacy works
            </button>
          </div>
          <div className="tool-cloud">
            <span>0 uploads</span><span>no account</span><span>no tracking</span><span>no cookies</span><span>no score</span>
          </div>
        </section>

        <section id="rules" className="projects">
          <div className="section-line"><span>Eight rules, plus HTML</span><span>Each one lists what it misses</span></div>
          <div className="project-grid rule-grid">
            <article className="rule-card reveal"><p>01</p><h3>XSS</h3><span>innerHTML, document.write, dangerouslySetInnerHTML and javascript: links. It follows a value back one variable. Two is too far.</span></article>
            <article className="rule-card reveal"><p>02</p><h3>Dynamic execution</h3><span>eval, new Function, and setTimeout or setInterval when you hand them a string instead of a function.</span></article>
            <article className="rule-card reveal"><p>03</p><h3>SQL injection</h3><span>Queries glued together with + or template strings and passed to something that looks like a database. It's narrow on purpose.</span></article>
            <article className="rule-card reveal"><p>04</p><h3>Hardcoded secrets</h3><span>Keys from OpenAI, Stripe, AWS, GitHub and friends, plus random-looking strings that might be keys. UUIDs and hashes get left alone.</span></article>
            <article className="rule-card reveal"><p>05</p><h3>Node command patterns</h3><span>exec, execSync and spawn({'{'} shell: true {'}'}) when the command isn't a fixed string.</span></article>
            <article className="rule-card reveal"><p>06</p><h3>Weak auth patterns</h3><span>Hardcoded password checks, passwords stored as MD5 or SHA-256, reset codes made with Math.random(), and JWT secrets typed into the code.</span></article>
            <article className="rule-card reveal"><p>07</p><h3>Dependency hygiene</h3><span>"latest" as a version, git dependencies, sketchy install scripts and dev tools sitting in the wrong section of package.json.</span></article>
            <article className="rule-card reveal"><p>08</p><h3>Express routes</h3><span>Request input in HTML, redirects, file paths and fetched URLs. Plus missing ownership and admin checks, owner ids taken from the client, and secrets sent back in responses.</span></article>
            <article className="rule-card reveal"><p>HTML</p><h3>HTML hygiene</h3><span>Missing viewport, missing alt text, inline onclick. Basic housekeeping. It's not a security scan.</span></article>
          </div>
        </section>

        <section id="exports" className="why reveal">
          <h2><span>• Export</span> Take the results with you.</h2>
          <div className="why-grid">
            <article><h3>PDF</h3><p>A report you can send to someone who is never going to open a terminal.</p></article>
            <article><h3>SARIF 2.1.0</h3><p>The format GitHub code scanning and VS Code already read. Each rule links to its own docs page.</p></article>
            <article><h3>JSON</h3><p>Everything XAUDIT found in one file, for when you want to do your own thing with it.</p></article>
            <article><h3>No grades</h3><p>There's no score out of 100. A number like that makes messy code look finished, like putting a clean sticker on a dirty cup.</p></article>
            <article><h3>Limitations</h3><p>Every finding says what matched, why it matters, how to fix it and what the rule can't see.</p></article>
          </div>
          <button className="cta" onClick={() => navigate('/export')}><span>+</span> Export formats</button>
        </section>

        <section id="tests" className="contact reveal">
          <div className="test-stack" aria-hidden="true">
            <span>Vitest</span>
            <span>Playwright</span>
            <span>Fixtures</span>
            <span>Benchmarks</span>
          </div>
          <div>
            <p>234 tests<br /><span>Run on every pull request</span></p>
            <p className="eyebrow purple"><span></span>Testing</p>
            <h2>If this site says XAUDIT does something, there's a test that checks it does.</h2>
            <button className="cta" style={{ marginTop: '28px' }} onClick={() => navigate('/tests')}>
              <span>+</span> See the test suite
            </button>
          </div>
        </section>

        <section className="awards reveal">
          <div className="award-track">
            <div><CheckIcon />A real browser clicks through the whole app and checks nothing gets sent out</div>
            <div><CheckIcon />If a rule loses its docs page, the tests fail</div>
            <div><CheckIcon />Every false alarm I fixed got its own test so it stays fixed</div>
            <div><CheckIcon />A second set of test files, written before the engine ever saw them</div>
            <div><CheckIcon />I tried to break it myself and found a real privacy bug. It's fixed.</div>

            <div><CheckIcon />A real browser clicks through the whole app and checks nothing gets sent out</div>
            <div><CheckIcon />If a rule loses its docs page, the tests fail</div>
            <div><CheckIcon />Every false alarm I fixed got its own test so it stays fixed</div>
            <div><CheckIcon />A second set of test files, written before the engine ever saw them</div>
            <div><CheckIcon />I tried to break it myself and found a real privacy bug. It's fixed.</div>
          </div>
        </section>

        <section id="docs" className="testimonials reveal">
          <p className="eyebrow purple"><span></span>Docs</p>
          <h2>The docs cover what XAUDIT does, what it misses and every time I changed my mind.</h2>
          <div className="testimonial-row">
            <article>
              <div className="doc-badge">README</div>
              <blockquote>Setup, the security policy, how the engine is built, and a full list of what the first version of this project got wrong.</blockquote>
              <p>Project docs <span>Start with the README</span></p>
            </article>
            <article>
              <div className="doc-badge">RULES</div>
              <blockquote>Every rule gets its own page with what it catches, a safe example and the cases it skips on purpose.</blockquote>
              <p>docs/rules/*.md <span>Checked by tests</span></p>
            </article>
            <article>
              <div className="doc-badge">STACK</div>
              <blockquote>React 19, Vite 7, Tailwind 4, TypeScript, Babel, Vitest and Playwright, hosted on Vercel.</blockquote>
              <p>Implementation <span>No backend</span></p>
            </article>
          </div>
          <div style={{ marginTop: '36px' }}>
            <button className="cta" onClick={() => navigate('/docs')}>
              <span>+</span> Read the docs
            </button>
          </div>
        </section>

        <footer>
          <div className="footer-cta">
            <h2>Paste some code and see what it finds.</h2>
            <button className="cta dark" onClick={handleStartAudit}>
              <span>+</span> Start Audit
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
