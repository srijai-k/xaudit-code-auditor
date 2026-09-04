import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import logoXa from '../assets/logo-xa.png';
import '../landing.css';

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

        <section className="hero reveal">
          <p className="eyebrow purple"><span></span>Client-side static code checker</p>
          <h1>XAUDIT flags risky code patterns without pretending to be more than it is.</h1>
          <p className="hero-copy">Paste JavaScript, TypeScript, React/JSX, HTML, or a package.json. XAUDIT runs locally in your browser, points out patterns worth a human look, and documents the limits of every rule.</p>
          <div className="hero-actions">
            <button className="cta primary-audit-cta" onClick={handleStartAudit}>
              <span>+</span> Start Audit
            </button>
          </div>
        </section>

        <section className="showpiece reveal" aria-label="XAUDIT interface preview">
          <div className="shape-notch top"></div>
          <div className="audit-ui">
            <div className="audit-window">
              <div className="window-bar"><span></span><span></span><span></span><b>worker.ts</b></div>
              <pre><code>{`const result = await audit({
  language: "tsx",
  maxBytes: 500_000,
  network: false
});`}</code></pre>
            </div>
            <div className="finding-card">
              <p>XSS</p>
              <h3>innerHTML receives traced user input</h3>
              <span>Why it matters</span>
              <small>HTML injection can become script execution. Prefer textContent or a sanitizer with a defined policy.</small>
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

        <section id="engine" className="services reveal">
          <p className="eyebrow purple"><span></span>Analysis engine</p>
          <h2>Real parsing, narrow rules, and zero network calls in the audit path.</h2>
          <div className="service-grid">
            <article className={expandedCard === 0 ? 'is-expanded' : expandedCard !== null ? 'is-shrunk' : ''}>
              <h3>Worker-bound</h3>
              <p>Analysis runs entirely in a Web Worker, off the UI thread, with no network calls anywhere in the pipeline.</p>
              <button 
                className="expand-card-btn" 
                onClick={(e) => toggleExpandCard(0, e)} 
                aria-label="Expand Worker-bound card"
                title={expandedCard === 0 ? "Collapse card" : "Expand card"}
              >
                →
              </button>
            </article>
            <article className={expandedCard === 1 ? 'is-expanded' : expandedCard !== null ? 'is-shrunk' : ''}>
              <h3>Parsed</h3>
              <p>JSX and TypeScript syntax are parsed into an AST. There is no type checker, and HTML uses a lighter attribute/text scan.</p>
              <button 
                className="expand-card-btn" 
                onClick={(e) => toggleExpandCard(1, e)} 
                aria-label="Expand Parsed card"
                title={expandedCard === 1 ? "Collapse card" : "Expand card"}
              >
                →
              </button>
            </article>
            <article className={expandedCard === 2 ? 'is-expanded' : expandedCard !== null ? 'is-shrunk' : ''}>
              <h3>Bounded</h3>
              <p>Input above 500KB is rejected before analysis. Findings are deduplicated by rule and location.</p>
              <button 
                className="expand-card-btn" 
                onClick={(e) => toggleExpandCard(2, e)} 
                aria-label="Expand Bounded card"
                title={expandedCard === 2 ? "Collapse card" : "Expand card"}
              >
                →
              </button>
            </article>
          </div>
          <button className="cta" onClick={() => navigate('/rules')}><span>+</span> See the rules</button>
        </section>

        <section id="privacy" className="vision reveal">
          <div>
            <p className="eyebrow red"><span></span>Privacy by default</p>
            <h2>Your code does not leave the browser.</h2>
            <p>XAUDIT stores nothing by default. The opt-in local history saves only counts, finding titles, and a masked ~120-character excerpt to plaintext localStorage. It never saves raw code or full secrets.</p>
            <button className="cta" style={{ marginTop: '28px' }} onClick={() => navigate('/privacy')}>
              <span>+</span> Read Privacy Architecture
            </button>
          </div>
          <div className="tool-cloud">
            <span>worker</span><span>AST</span><span>500KB cap</span><span>dedupe</span><span>no score</span>
          </div>
        </section>

        <section id="rules" className="projects">
          <div className="section-line"><span>Seven rule modules</span><span>Documented exclusions</span></div>
          <div className="project-grid rule-grid">
            <article className="rule-card reveal"><p>01</p><h3>XSS</h3><span>innerHTML, document.write, dangerouslySetInnerHTML, and javascript: URIs. Traces one variable hop and avoids JSX event props.</span></article>
            <article className="rule-card reveal"><p>02</p><h3>Dynamic execution</h3><span>eval, new Function, and string-form setTimeout or setInterval.</span></article>
            <article className="rule-card reveal"><p>03</p><h3>SQL injection</h3><span>A narrow heuristic for concatenation or interpolation into .query, .execute, or .raw on a DB-shaped receiver.</span></article>
            <article className="rule-card reveal"><p>04</p><h3>Hardcoded secrets</h3><span>Vendor-prefixed tokens, name-context fallback, and calibrated entropy checks while excluding UUIDs, hashes, and base64 images.</span></article>
            <article className="rule-card reveal"><p>05</p><h3>Node command patterns</h3><span>exec, execSync, and spawn({'{'} shell: true {'}'}) with non-literal input.</span></article>
            <article className="rule-card reveal"><p>06</p><h3>Weak auth patterns</h3><span>Credential-shaped literal comparisons and jwt.decode() without jwt.verify().</span></article>
            <article className="rule-card reveal"><p>07</p><h3>Dependency hygiene</h3><span>Unpinned versions, non-registry sources, suspicious scripts, and misplaced dev tools in package.json.</span></article>
            <article className="rule-card reveal"><p>HTML</p><h3>HTML hygiene</h3><span>Viewport, alt text, and inline handlers. Explicitly not AST-based and not security-grade.</span></article>
          </div>
        </section>

        <section id="exports" className="why reveal">
          <h2><span>• Export</span> Built for handoff, not theatrics.</h2>
          <div className="why-grid">
            <article><h3>PDF</h3><p>A readable client-side report for reviews and lightweight audits.</p></article>
            <article><h3>SARIF 2.1.0</h3><p>Includes per-rule helpUri links into docs/rules/ for downstream tooling.</p></article>
            <article><h3>JSON</h3><p>The full result object plus the disclaimer, produced entirely client-side.</p></article>
            <article><h3>No grades</h3><p>No letter score and no risk theater. Scoring was removed on purpose.</p></article>
            <article><h3>Limitations</h3><p>Every finding includes what matched, why it matters, a safer example, and its own limits.</p></article>
          </div>
        </section>

        <section id="tests" className="contact reveal">
          <div className="test-stack" aria-hidden="true">
            <span>Vitest</span>
            <span>Playwright</span>
            <span>Fixtures</span>
            <span>Benchmarks</span>
          </div>
          <div>
            <p>Nothing aspirational<br /><span>Everything has a test</span></p>
            <p className="eyebrow purple"><span></span>Testing</p>
            <h2>Claims are backed by unit, regression, benchmark, docs, and e2e tests.</h2>
          </div>
        </section>

        <section className="awards reveal">
          <div className="award-track">
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />No network requests through a real Playwright click-through</div>
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />Docs coverage fails if a ruleId loses its page</div>
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />Regression fixtures for parameterized queries and decorator syntax</div>
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />Independent benchmarks with explicit disclaimers</div>
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />Hostile self-audit found and fixed a real privacy bug</div>

            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />No network requests through a real Playwright click-through</div>
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />Docs coverage fails if a ruleId loses its page</div>
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />Regression fixtures for parameterized queries and decorator syntax</div>
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />Independent benchmarks with explicit disclaimers</div>
            <div><img src="/assets/11b4a8fd0365aa05.svg" alt="" />Hostile self-audit found and fixed a real privacy bug</div>
          </div>
        </section>

        <section id="docs" className="testimonials reveal">
          <p className="eyebrow purple"><span></span>Docs</p>
          <h2>The documentation says what XAUDIT does, what it misses, and what changed.</h2>
          <div className="testimonial-row">
            <article>
              <div className="doc-badge">README</div>
              <blockquote>README.md, SECURITY.md, architecture, baseline audit, model improvements, self-audit, and one page per rule.</blockquote>
              <p>Project docs <span>No hidden roadmap claims</span></p>
            </article>
            <article>
              <div className="doc-badge">RULES</div>
              <blockquote>Each rule documents its match shape, safer example, and exclusions.</blockquote>
              <p>docs/rules/*.md <span>Covered by tests</span></p>
            </article>
            <article>
              <div className="doc-badge">STACK</div>
              <blockquote>React 19, Vite 7, Tailwind 4, TypeScript, Framer Motion, Vitest, Playwright, and Vercel security headers.</blockquote>
              <p>Implementation <span>Client-side checker</span></p>
            </article>
          </div>
          <div style={{ marginTop: '36px' }}>
            <button className="cta" onClick={() => navigate('/docs')}>
              <span>+</span> Explore Documentation
            </button>
          </div>
        </section>

        <footer>
          <div className="footer-cta">
            <h2>Audit the claim before you trust the result.</h2>
            <button className="cta dark" onClick={handleStartAudit}>
              <span>+</span> Start Audit
            </button>
          </div>
          <div className="footer-bottom">
            <span>XAUDIT</span>
            <span>Client-side static checker · no network audit path</span>
            <span>PDF / SARIF / JSON</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
