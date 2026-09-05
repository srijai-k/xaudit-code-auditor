import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import '../landing.css';

export default function TestsPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-wrapper" style={{ background: '#222222' }}>
            <TopTicker />

            {/* Page Shell in Off-White Cream Theme (#f4f3ef) */}
            <main className="page-shell" style={{ background: '#f4f3ef', color: '#111', minHeight: '100vh', borderRadius: '32px' }}>
                <HeaderNav />

                {/* Hero Section matching the Rules/Privacy reference layout */}
                <div className="privacy-hero-pad" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px',
                }}>
                    <div>
                        <div className="text-fade-in stagger-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7c3aed', marginBottom: '20px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>
                            Testing & Verification
                        </div>
                        <h1 className="text-fade-in stagger-2" style={{ fontSize: 'clamp(44px, 5.5vw, 76px)', fontWeight: 400, color: '#111', margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '980px' }}>
                            Claims are backed by unit, regression, benchmark, docs, and e2e tests.
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
                                Nothing on this site is aspirational. Every documented claim has a corresponding test, and the whole suite runs on every change before it ships.
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
                                    href="#coverage"
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
                                    title="Scroll to test coverage"
                                >
                                    ↓
                                </a>
                            </div>
                        </div>

                        {/* Feature Pills Grid */}
                        <div className="privacy-pills-grid" style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>213</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Passing Tests</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>22</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Test Files</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>5</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Test Categories</div>
                            </div>
                            <div className="privacy-pill-wide" style={{ background: '#161616', color: '#fff', padding: '24px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>100%</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Suite Passing</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Sections */}
                <div id="coverage" className="privacy-content-pad" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

                    {/* Section 1: Test Categories */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Five Kinds of Test
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            What each test category actually proves
                        </h2>

                        {/* A stacked definition list, not a card grid — this content
                            reads as "here's what each category name means," which a
                            table of contents shape communicates better than tiles. */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {[
                                { tag: 'Unit', title: 'tests/rules/*', body: "Each of the 8 rule modules is tested in isolation against both matches and deliberate non-matches, so a rule's stated exclusions are enforced, not just documented." },
                                { tag: 'Regression', title: 'tests/regression/*', body: 'Fixed real bugs get a permanent fixture: parameterized queries, decorator syntax, modern syntax, and short-input rejection all have a named guard against recurrence.' },
                                { tag: 'Docs', title: 'Coverage', body: 'A dedicated test extracts every ruleId from source at test-run time and fails the build if any one of them loses its documentation page.' },
                                { tag: 'E2E', title: 'Playwright', body: 'A real click-through of the production app — landing page → checker → scan → export PDF — with a hard assertion that zero non-local network activity occurs.' },
                            ].map((cat, i) => (
                                <div key={cat.tag} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '20px 0', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
                                    <div style={{ flexShrink: 0, width: '64px', height: '64px', borderRadius: '16px', background: '#161616', color: '#cca7f3', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', padding: '6px', letterSpacing: '0.02em', overflowWrap: 'anywhere' }}>
                                        {cat.tag}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{cat.title}</h3>
                                        <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{cat.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 2: Independent Benchmark */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Independent Benchmark
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            Measured against a corpus, not self-graded
                        </h2>
                        <p style={{ fontSize: '17px', color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
                            A 14-file, multi-concern benchmark corpus, built independently of the rule implementations, compared against the pre-rewrite baseline:
                        </p>

                        {/* An actual bar chart — two values per metric read far
                            faster as bar length than as two parallel bullet lists. */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', fontSize: '13px', fontWeight: 700, color: '#555' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }} /> Pre-rewrite baseline
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }} /> Current benchmark corpus
                            </span>
                        </div>

                        {[
                            { label: 'Precision', before: 0.64, after: 1.0 },
                            { label: 'Recall', before: 0.41, after: 1.0 },
                            { label: 'F1', before: 0.50, after: 1.0 },
                        ].map((m) => (
                            <div key={m.label} style={{ marginBottom: '22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: '#111', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    <span>{m.label}</span>
                                    <span style={{ color: '#888', fontWeight: 600, textTransform: 'none', letterSpacing: 'normal' }}>{m.before.toFixed(2)} → {m.after.toFixed(2)}</span>
                                </div>
                                <div style={{ position: 'relative', height: '10px', borderRadius: '6px', background: '#f0efec', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${m.before * 100}%`, background: '#ef4444', borderRadius: '6px' }} />
                                </div>
                                <div style={{ position: 'relative', height: '10px', borderRadius: '6px', background: '#f0efec', overflow: 'hidden', marginTop: '6px' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${m.after * 100}%`, background: '#10b981', borderRadius: '6px' }} />
                                </div>
                            </div>
                        ))}

                        <p style={{ fontSize: '13px', color: '#888', margin: '8px 0 0', lineHeight: 1.6 }}>
                            Computed from 13 true positives / 0 false positives / 0 false negatives on this specific 14-file corpus — not a universal guarantee across all possible input.
                        </p>
                    </section>

                    {/* Section 3: Drift Protection */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                            Caught by Testing
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            What the suite has actually caught
                        </h2>

                        {/* An incident log — left accent rule, not another dark
                            card grid: these are two logged-and-closed findings,
                            read like entries, not parallel feature callouts. */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '20px' }}>
                                <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                    F-01 · A Real Privacy Bug
                                </div>
                                <div style={{ color: '#333', fontSize: '15px', lineHeight: 1.65 }}>
                                    A hostile self-audit found a non-vendor high-entropy secret leaking unmasked into local storage history — fixed with a matching redaction pass before storage writes.
                                </div>
                            </div>

                            <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '20px' }}>
                                <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                    F-05 · A Silent Zero-Finding Gap
                                </div>
                                <div style={{ color: '#333', fontSize: '15px', lineHeight: 1.65 }}>
                                    Manually selecting "HTML" mode on non-HTML input once returned a clean, 0-finding result — fixed by adding an informational disclosure finding instead of failing silently.
                                </div>
                            </div>
                        </div>
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
            </main>
        </div>
    );
}
