import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import '../landing.css';

export default function ExportPage() {
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
                            Export
                        </div>
                        <h1 className="text-fade-in stagger-2" style={{ fontSize: 'clamp(44px, 5.5vw, 76px)', fontWeight: 400, color: '#111', margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '980px' }}>
                            Three ways to take the results with you.
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
                                All three get made right in your browser from the findings already on your screen. Nothing gets checked again on the way out, so the report always matches what you saw.
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
                                    href="#formats"
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
                                    title="Scroll down to the formats"
                                >
                                    ↓
                                </a>
                            </div>
                        </div>

                        {/* Feature Pills Grid */}
                        <div className="privacy-pills-grid" style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                PDF
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                JSON
                            </div>
                            <div className="privacy-pill-wide" style={{ background: '#161616', color: '#fff', padding: '24px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                SARIF 2.1.0
                            </div>
                            <div className="privacy-pill-wide" style={{ background: '#161616', color: '#fff', padding: '24px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                no grades
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Sections */}
                <div id="formats" className="privacy-content-pad" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

                    {/* Section 1: Three Formats */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Same findings, every time
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            They all come from the same result
                        </h2>

                        {/* File-type tiles — a colored "file icon" band per format,
                            deliberately not the dark-chip card grid used elsewhere. */}
                        <div className="privacy-grid-auto" style={{ display: 'grid', gap: '24px' }}>
                            <div style={{ background: '#fff', border: '2px solid #ef4444', borderRadius: '20px', overflow: 'hidden' }}>
                                <div style={{ background: '#ef4444', color: '#fff', padding: '18px 24px', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                    PDF
                                </div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.65, margin: 0, padding: '22px 24px' }}>
                                    A clean report you can send to a teammate or a teacher. No account and no upload needed.
                                </p>
                            </div>

                            <div style={{ background: '#fff', border: '2px solid #7c3aed', borderRadius: '20px', overflow: 'hidden' }}>
                                <div style={{ background: '#7c3aed', color: '#fff', padding: '18px 24px', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                    SARIF 2.1.0
                                </div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.65, margin: 0, padding: '22px 24px' }}>
                                    The format GitHub code scanning, VS Code's SARIF viewer and most CI tools already understand. Each rule's <code>helpUri</code> links to its own section in the docs.
                                </p>
                            </div>

                            <div style={{ background: '#fff', border: '2px solid #d97706', borderRadius: '20px', overflow: 'hidden' }}>
                                <div style={{ background: '#d97706', color: '#fff', padding: '18px 24px', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                    JSON
                                </div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.65, margin: 0, padding: '22px 24px' }}>
                                    The whole result, plus the same disclaimer you see on screen. Handy if you want to build something on top of it.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Scoring Removed */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                            No grades
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            Why there's no score
                        </h2>
                        {/* A struck-through grade is the actual image of what got
                            removed — more direct than another card grid, and it
                            visually anchors the reasons that follow. */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap', marginBottom: '32px' }}>
                            <div style={{ fontSize: '72px', fontWeight: 800, color: '#bbb', lineHeight: 1, textDecoration: 'line-through', textDecorationColor: '#ef4444', textDecorationThickness: '5px' }}>
                                A+
                            </div>
                            <p style={{ fontSize: '17px', color: '#555', margin: 0, lineHeight: 1.6, maxWidth: '460px' }}>
                                An earlier version gave your code a letter grade like this one. I took it out completely. Here's why:
                            </p>
                        </div>

                        <ol style={{ margin: 0, paddingLeft: '22px', color: '#333', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px', lineHeight: 1.65 }}>
                            <li><strong style={{ color: '#111' }}>The grade didn't mean anything.</strong> For a grade to be fair, the number of findings would have to say something real about how risky the code is. With a handful of narrow rules and no data-flow tracking, it just doesn't.</li>
                            <li><strong style={{ color: '#111' }}>It failed its own tests.</strong> The scoring disagreed with my own hand-written expectations on two out of nine test cases. Hard to trust a grade that can't pass its own quiz.</li>
                            <li><strong style={{ color: '#111' }}>People stop at an A.</strong> You see an A, you close the tab. A plain count of findings is less satisfying to look at, which is kind of the point.</li>
                        </ol>
                    </section>

                    {/* Section 3: What Every Finding Includes */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Every finding
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            What every finding comes with
                        </h2>

                        {/* Connected flow chips — this genuinely is a sequence (the
                            order a finding is read in), so show it as one. */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                            {['What matched', 'Why it matters', 'A safer example', "What it can't see"].map((label, i, arr) => (
                                <React.Fragment key={label}>
                                    <div style={{ background: '#161616', color: '#fff', padding: '14px 22px', borderRadius: '999px', fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {label}
                                    </div>
                                    {i < arr.length - 1 && <span style={{ color: '#bbb', fontSize: '18px' }}>→</span>}
                                </React.Fragment>
                            ))}
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
