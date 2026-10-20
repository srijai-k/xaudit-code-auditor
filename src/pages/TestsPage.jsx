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
                            Testing
                        </div>
                        <h1 className="text-fade-in stagger-2" style={{ fontSize: 'clamp(44px, 5.5vw, 76px)', fontWeight: 400, color: '#111', margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '980px' }}>
                            How I know it does what this site says.
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
                                If this site says XAUDIT does something, there's a test that checks it. The whole suite runs on every pull request before anything gets merged.
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
                                    <span style={{ fontSize: '18px' }}>+</span> Try it
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
                                    title="Scroll down to the tests"
                                >
                                    ↓
                                </a>
                            </div>
                        </div>

                        {/* Feature Pills Grid */}
                        <div className="privacy-pills-grid" style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>234</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Tests</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>23</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Test files</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>21</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Benchmark files</div>
                            </div>
                            <div className="privacy-pill-wide" style={{ background: '#161616', color: '#fff', padding: '24px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>0</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Failing right now</div>
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
                            Four kinds of test
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            What each kind of test checks
                        </h2>

                        {/* A stacked definition list, not a card grid — this content
                            reads as "here's what each category name means," which a
                            table of contents shape communicates better than tiles. */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {[
                                { tag: 'Unit', title: 'tests/rules/*', body: "Each of the 8 rules gets tested against code it should flag and code it should leave alone. If a rule says it skips something, there's a test making sure it does." },
                                { tag: 'Regression', title: 'tests/regression/*', body: "Every real bug I fixed gets a test so it can't sneak back in. Parameterized queries, decorators, newer syntax and short inputs all have one." },
                                { tag: 'Docs', title: 'Coverage', body: 'A test pulls every rule ID out of the source code and fails if any of them is missing a docs page.' },
                                { tag: 'E2E', title: 'Playwright', body: 'Playwright opens the real built app, goes from the landing page to the checker, runs a scan and exports a PDF. If anything tries to reach the internet along the way, it fails.' },
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
                            Benchmark
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            A separate set of test files
                        </h2>
                        <p style={{ fontSize: '17px', color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
                            21 realistic files with a few things going on in each. I wrote down what XAUDIT should find in every one before running it. I wrote these myself too, so it isn't a third-party test. It's just harder to cheat on.
                        </p>

                        {/* An actual bar chart — two values per metric read far
                            faster as bar length than as two parallel bullet lists. */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', fontSize: '13px', fontWeight: 700, color: '#555' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }} /> Old version (different 30-case test)
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }} /> Current version (these 21 files)
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
                            22 found, 0 false alarms, 0 missed. A perfect score on my own test files mostly means the rules do what I meant them to. Real code is messier. The old numbers come from a different test, so treat the comparison as rough.
                        </p>
                    </section>

                    {/* Section 3: Drift Protection */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                            Bugs it caught
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            Things testing actually found
                        </h2>

                        {/* An incident log — left accent rule, not another dark
                            card grid: these are two logged-and-closed findings,
                            read like entries, not parallel feature callouts. */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '20px' }}>
                                <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                    F-01 · A real privacy bug
                                </div>
                                <div style={{ color: '#333', fontSize: '15px', lineHeight: 1.65 }}>
                                    While trying to break XAUDIT on purpose, I found that a random-looking secret with no known format was getting saved to history unmasked. Now everything goes through the same masking step before it gets saved.
                                </div>
                            </div>

                            <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '20px' }}>
                                <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                    F-05 · A clean result that wasn't
                                </div>
                                <div style={{ color: '#333', fontSize: '15px', lineHeight: 1.65 }}>
                                    Pick HTML mode, paste something that isn't HTML, and XAUDIT used to say zero findings without having checked anything. Now it says the input doesn't look like HTML and the JavaScript rules didn't run, and tells you to use Auto-detect. Script blocks it can't parse get a note too.
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <footer>
                    <div className="footer-cta">
                        <h2>Paste some code and see what it finds.</h2>
                        <button className="cta dark" onClick={() => navigate('/check')}>
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
