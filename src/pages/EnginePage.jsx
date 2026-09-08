import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import '../landing.css';

export default function EnginePage() {
    const navigate = useNavigate();

    return (
        <div className="landing-wrapper" style={{ background: '#222222' }}>
            <TopTicker />

            {/* Page Shell in Off-White Cream Theme (#f4f3ef) */}
            <main className="page-shell" style={{ background: '#f4f3ef', color: '#111', minHeight: '100vh', borderRadius: '32px' }}>
                <HeaderNav />

                <div className="page-shell-body">
                {/* Hero Section matching the Rules/Privacy reference layout */}
                <div className="privacy-hero-pad" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px',
                }}>
                    <div>
                        <div className="text-fade-in stagger-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7c3aed', marginBottom: '20px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>
                            Analysis Engine
                        </div>
                        <h1 className="text-fade-in stagger-2" style={{ fontSize: 'clamp(44px, 5.5vw, 76px)', fontWeight: 400, color: '#111', margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '980px' }}>
                            Real parsing, narrow rules, and zero network calls in the audit path.
                        </h1>
                    </div>

                    {/* Hero Split: Accent Lavender Card + Dark Feature Pills */}
                    <div className="privacy-grid-auto" style={{
                        display: 'grid',
                        gap: '28px',
                        alignItems: 'stretch'
                    }}>
                        <div style={{
                            background: '#cca7f3',
                            color: '#111',
                            borderRadius: '32px',
                            padding: '40px 44px',
                            display: 'flex',
                            flexDirection: 'column',
                            justify: 'space-between',
                            gap: '32px',
                            boxShadow: '0 14px 40px rgba(124, 58, 237, 0.12)'
                        }}>
                            <p style={{ fontSize: '20px', color: '#1a1028', lineHeight: 1.55, margin: 0, fontWeight: 450 }}>
                                Every step of analysis — validation, parsing, rule evaluation, and deduplication — runs inside a Web Worker in your own browser tab. Nothing is uploaded, and nothing calls out.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => navigate('/check')}
                                    style={{
                                        background: '#161616',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '14px 28px',
                                        borderRadius: '999px',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'transform 0.2s ease'
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>+</span> Start Local Audit
                                </button>
                                <a
                                    href="#pipeline"
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        border: '1px solid rgba(22,22,22,0.25)',
                                        display: 'grid',
                                        placeItems: 'center',
                                        color: '#161616',
                                        fontSize: '18px',
                                        textDecoration: 'none',
                                        transition: 'background 0.2s ease'
                                    }}
                                    title="Scroll to pipeline details"
                                >
                                    ↓
                                </a>
                            </div>
                        </div>

                        {/* Feature Pills Grid */}
                        <div className="privacy-pills-grid" style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                worker
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                AST
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                1 hop
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                500KB cap
                            </div>
                            <div className="privacy-pill-wide" style={{ background: '#161616', color: '#fff', padding: '24px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                zero network
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Sections */}
                <div id="pipeline" className="privacy-content-pad" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

                    {/* Section 1: The Pipeline */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Deterministic Pipeline
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 24px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            Every request follows the same fixed path
                        </h2>

                        <code style={{ display: 'block', background: '#161616', color: '#e0e0e0', padding: '24px 26px', borderRadius: '20px', fontSize: '13px', lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '32px' }}>
{`input text
  → file-size & type validation   (500KB hard cap, rejected outright)
  → Web Worker                    (off the UI thread)
  → parser selected by mode       (HTML attribute scan OR @babel/parser AST)
  → AST traversal / narrow rules
  → normalized Finding objects
  → deduplication (by rule + location)
  → result UI`}
                        </code>

                        {/* Vertical connected step flow — deliberately not the card-grid
                            pattern used elsewhere, since this content genuinely reads as
                            a sequence rather than three parallel facts. */}
                        <div style={{ position: 'relative', paddingLeft: '58px' }}>
                            <div aria-hidden="true" style={{ position: 'absolute', left: '23px', top: '6px', bottom: '6px', width: '2px', background: 'linear-gradient(#7c3aed, rgba(124,58,237,0.15))' }} />

                            {[
                                { n: 1, title: 'Worker isolation', body: <>A single worker is spawned and communicated with over <code>postMessage</code>. Every request carries an incrementing request ID; the client discards any response whose ID doesn't match the most recent.</> },
                                { n: 2, title: 'AST-based parsing', body: <><code>@babel/parser</code> + <code>@babel/traverse</code>, chosen over <code>typescript-estree</code> (full TS compiler, Node-oriented) and <code>acorn</code> (bolted-on TS support). One parser accepts the union of JS/TS/JSX/TSX.</> },
                                { n: 3, title: 'Bounded & deduplicated', body: <>Input above 500KB is rejected before analysis starts — not silently truncated. Findings are deduplicated by rule ID and source location before they reach the UI.</> },
                            ].map((step, i, arr) => (
                                <div key={step.n} style={{ position: 'relative', marginBottom: i < arr.length - 1 ? '36px' : 0 }}>
                                    <div style={{ position: 'absolute', left: '-58px', top: '0', width: '46px', height: '46px', borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '18px', boxShadow: '0 6px 16px rgba(124,58,237,0.35)' }}>
                                        {step.n}
                                    </div>
                                    <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#111', margin: '2px 0 8px' }}>{step.title}</h3>
                                    <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.7, margin: 0, maxWidth: '640px' }}>{step.body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 2: 1-Hop Tracing */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Scope, Stated Honestly
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            One variable hop, not full data-flow analysis
                        </h2>
                        <p style={{ fontSize: '17px', color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
                            Every rule looks at a direct AST relationship at a single call or assignment site — there is no cross-function taint tracking anywhere in the engine.
                        </p>

                        {/* Segmented range indicator — the "1" boundary is the whole
                            point of this section, so make it a literal supported/not
                            supported track instead of another two-card grid. */}
                        <div style={{ display: 'flex', gap: '2px', borderRadius: '20px', overflow: 'hidden', marginBottom: '32px' }}>
                            <div style={{ flex: '1 1 0%', minWidth: 0, background: '#2a2a2a', color: '#888', padding: '22px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '26px', fontWeight: 800 }}>0</div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, marginTop: '6px', letterSpacing: '0.04em', overflowWrap: 'anywhere' }}>Same line</div>
                            </div>
                            <div style={{ flex: '1.4 1 0%', minWidth: 0, background: '#7c3aed', color: '#fff', padding: '22px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '26px', fontWeight: 800 }}>1</div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, marginTop: '6px', letterSpacing: '0.04em', overflowWrap: 'anywhere' }}>Hop — traced ✓</div>
                            </div>
                            <div style={{ flex: '1 1 0%', minWidth: 0, background: '#2a2a2a', color: '#888', padding: '22px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '26px', fontWeight: 800 }}>2+</div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, marginTop: '6px', letterSpacing: '0.04em', overflowWrap: 'anywhere' }}>Not traced</div>
                            </div>
                        </div>

                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>✓</span>
                                <span style={{ color: '#333', fontSize: '15px', lineHeight: 1.6 }}>A tainted variable assigned one line above a dangerous sink</span>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>✓</span>
                                <span style={{ color: '#333', fontSize: '15px', lineHeight: 1.6 }}>Direct calls to <code>eval</code>, <code>innerHTML</code>, <code>exec</code>, and similar receivers</span>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>✓</span>
                                <span style={{ color: '#333', fontSize: '15px', lineHeight: 1.6 }}>Sanitizer-wrapped values, recognized and downgraded in severity</span>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>✗</span>
                                <span style={{ color: '#333', fontSize: '15px', lineHeight: 1.6 }}>Taint that crosses more than one variable hop or a function boundary</span>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>✗</span>
                                <span style={{ color: '#333', fontSize: '15px', lineHeight: 1.6 }}>Anything requiring real type information — there is no type checker</span>
                            </li>
                        </ul>
                    </section>
                </div>

                <footer>
                    <div className="footer-cta">
                        <h2>Audit the claim before you trust the result.</h2>
                        <button className="cta dark" onClick={() => navigate('/check')}>
                            <span>+</span> Start Audit
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
