import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import '../landing.css';

export default function PrivacyPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-wrapper" style={{ background: '#222222' }}>
            <TopTicker />
            
            {/* Page Shell in Off-White Cream Theme (#f4f3ef) */}
            <main className="page-shell" style={{ background: '#f4f3ef', color: '#111', minHeight: '100vh', borderRadius: '32px' }}>
                <HeaderNav />

                {/* Hero Section matching the reference layout */}
                <div className="privacy-hero-pad" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px',
                }}>
                    <div>
                        <div className="text-fade-in stagger-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7c3aed', marginBottom: '20px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>
                            About Privacy
                        </div>
                        <h1 className="text-fade-in stagger-2" style={{ fontSize: 'clamp(44px, 5.5vw, 76px)', fontWeight: 400, color: '#111', margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '980px', fontFamily: 'Telegraf, "Haffer SQ", Arial, sans-serif' }}>
                            Your code never leaves your browser.
                        </h1>
                    </div>

                    {/* Hero Split: Accent Lavender Card + Dark Feature Pills */}
                    <div className="privacy-grid-auto" style={{
                        display: 'grid',
                        gap: '28px',
                        alignItems: 'stretch'
                    }}>
                        {/* Signature Lavender Accent Box */}
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
                                XAUDIT runs entirely inside a Web Worker off your main UI thread. No network calls, no tracking scripts, no WebSocket channels, and no server-side code storage anywhere in the pipeline.
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
                                    href="#devtools-verification"
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
                                    title="Scroll to technical details"
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
                                500KB cap
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                dedupe
                            </div>
                            <div className="privacy-pill-wide" style={{ background: '#161616', color: '#fff', padding: '24px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                no score
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Sections with Ample Vertical Spacing */}
                <div id="devtools-verification" className="privacy-content-pad" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

                    {/* Section 1: How this is actually true */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Zero Network Overhead
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            How this is actually true (not just claimed)
                        </h2>
                        
                        <div className="privacy-grid-auto" style={{ display: 'grid', gap: '24px' }}>
                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    01. Isolated Web Worker
                                </div>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                                    Analysis runs entirely in a Web Worker inside your tab — parsing and rule execution happen off the UI thread, with no <code>fetch</code>, <code>XMLHttpRequest</code>, <code>WebSocket</code>, or external SDK anywhere in the pipeline.
                                </p>
                            </div>

                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    02. DevTools Verification
                                </div>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                                    You can verify this yourself: open your browser's DevTools Network tab, paste code, run a check, and watch the request list. <strong style={{ color: '#fff' }}>Zero requests fire.</strong>
                                </p>
                            </div>

                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    03. Playwright E2E Assertion
                                </div>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                                    Verified via live network capture during scans and via a real Playwright end-to-end test that clicks through the production app (landing page → checker → scan → export PDF) with a hard assertion that zero non-local network activity occurs.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: What is stored locally */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Opt-in Persistence
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            What is stored locally (and what isn't)
                        </h2>
                        <p style={{ fontSize: '17px', color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
                            Nothing is written to storage unless you explicitly enable audit history in the UI settings.
                        </p>

                        <div className="privacy-grid-auto" style={{ display: 'grid', gap: '28px' }}>
                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    ✓ Saved in Local Storage (Opt-in)
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '15px', lineHeight: 1.8 }}>
                                    <li>Finding count per severity</li>
                                    <li>Matched rule IDs and titles</li>
                                    <li>Masked ~120-character code excerpt</li>
                                    <li>Timestamp of the check</li>
                                </ul>
                            </div>

                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    ✗ Never Saved Anywhere
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '15px', lineHeight: 1.8 }}>
                                    <li>Full raw source files</li>
                                    <li>Unmasked API tokens or keys</li>
                                    <li>User identity or IP address</li>
                                    <li>Analytics or diagnostic logs</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Disclosures & Boundaries */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                            Disclosures & Boundaries
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            Honest Security Boundaries
                        </h2>

                        <div className="privacy-grid-auto" style={{ display: 'grid', gap: '24px' }}>
                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ color: '#f87171', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                                    Unverified Offline / PWA Scope
                                </div>
                                <div style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.65 }}>
                                    Offline/PWA behavior is explicitly marked "not independently verified across browsers" — not claimed true, not claimed false.
                                </div>
                            </div>

                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ color: '#f87171', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                                    Host Infrastructure Security
                                </div>
                                <div style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.65 }}>
                                    This only covers what happens in the browser tab. It says nothing about the security of whatever host actually serves the built files — no client-side tool can protect against a compromised hosting platform.
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
