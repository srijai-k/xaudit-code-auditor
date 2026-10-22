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

                <div className="page-shell-body">
                {/* Hero Section matching the reference layout */}
                <div className="privacy-hero-pad" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px',
                }}>
                    <div>
                        <div className="text-fade-in stagger-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7c3aed', marginBottom: '20px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>
                            Privacy
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
                                Everything happens inside a Web Worker in your tab. There's no server to send your code to, so it doesn't get sent anywhere. No tracking scripts either. I couldn't tell you who uses this if I wanted to.
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
                                    title="Scroll down to the details"
                                >
                                    ↓
                                </a>
                            </div>
                        </div>

                        {/* Feature Pills Grid */}
                        <div className="privacy-pills-grid" style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                0 uploads
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                no account
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                no tracking
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                no cookies
                            </div>
                            <div className="privacy-pill-wide" style={{ background: '#161616', color: '#fff', padding: '24px 28px', borderRadius: '24px', fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', display: 'grid', placeItems: 'center' }}>
                                history is opt-in
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
                            Zero network requests
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            Don't take my word for it
                        </h2>
                        
                        <div className="privacy-grid-auto" style={{ display: 'grid', gap: '24px' }}>
                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    01. It runs in a worker
                                </div>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                                    Parsing and every rule run in a Web Worker inside your tab. There's no <code>fetch</code>, no <code>XMLHttpRequest</code>, no <code>WebSocket</code> and no outside SDK anywhere in that code. CI fails if one ever shows up.
                                </p>
                            </div>

                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    02. Check it yourself
                                </div>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                                    Open DevTools, go to the Network tab, paste some code and hit Run. Then watch the request list. <strong style={{ color: '#fff' }}>It stays empty.</strong>
                                </p>
                            </div>

                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    03. A robot checks too
                                </div>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                                    A Playwright test opens the real built app, clicks from the landing page to the checker, runs a scan and exports a PDF. If anything tries to reach the internet along the way, the test fails.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: What is stored locally */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            History is off by default
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            What gets saved if you turn it on
                        </h2>
                        <p style={{ fontSize: '17px', color: '#555', margin: '0 0 32px', lineHeight: 1.6 }}>
                            Nothing gets saved unless you turn on history in the checker. If you do, this is the whole list. It lives in localStorage on your own computer, in plain text.
                        </p>

                        <div className="privacy-grid-auto" style={{ display: 'grid', gap: '28px' }}>
                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    ✓ Saved in Local Storage (Opt-in)
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '15px', lineHeight: 1.8 }}>
                                    <li>How many findings of each severity</li>
                                    <li>The rule IDs and titles that matched</li>
                                    <li>The first ~120 characters of your code, secrets masked</li>
                                    <li>When you ran the check</li>
                                </ul>
                            </div>

                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                    ✗ Never Saved Anywhere
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '15px', lineHeight: 1.8 }}>
                                    <li>Your full code</li>
                                    <li>Any API key or token, unmasked</li>
                                    <li>Your name, email or anything that identifies you</li>
                                    <li>Analytics or tracking data</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: The fine print */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                            The fine print
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            What this page can't promise
                        </h2>

                        <div className="privacy-grid-auto" style={{ display: 'grid', gap: '24px' }}>
                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ color: '#f87171', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                                    Offline mode isn't tested
                                </div>
                                <div style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.65 }}>
                                    The app is set up to work offline, but I haven't been able to properly test that across browsers yet. It might work. I just can't say it does.
                                </div>
                            </div>

                            <div style={{ background: '#161616', color: '#fff', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ color: '#f87171', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                                    The host is out of my hands
                                </div>
                                <div style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.65 }}>
                                    Everything above is about what happens in your tab. The site itself is hosted on Vercel, which keeps normal server logs like any website, IP addresses included. And if the host itself got hacked, nothing running in your browser could fix that.
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
