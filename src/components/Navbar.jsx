import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoXa from '../assets/logo-xa.png';

export function TopTicker() {
    const location = useLocation();
    const isLight = location.pathname === '/privacy' || location.pathname === '/rules' || location.pathname === '/docs' || location.pathname === '/engine' || location.pathname === '/export' || location.pathname === '/tests';

    return (
        <div
            className="top-ticker"
            aria-label="Project marquee ticker"
            style={isLight ? {
                background: '#ffffff',
                color: '#555',
                border: 'none',
                borderBottom: 'none',
                boxShadow: 'none'
            } : {}}
        >
            <strong style={isLight ? { color: '#111' } : {}}>
                <span></span>Now checking
            </strong>
            <div className="ticker-track">
                <div className="ticker-inner">
                    <span style={isLight ? { color: '#444' } : {}}>Paste JavaScript, TypeScript, React/JSX, HTML, or <b style={isLight ? { color: '#111' } : {}}>package.json</b></span>
                    <span style={isLight ? { color: '#444' } : {}}>Runs in a Web Worker with <b style={isLight ? { color: '#111' } : {}}>no network calls</b></span>
                    <span style={isLight ? { color: '#444' } : {}}>Input is rejected above <b style={isLight ? { color: '#111' } : {}}>500KB</b></span>
                    <span style={isLight ? { color: '#444' } : {}}>No score, no grade, no <b style={isLight ? { color: '#111' } : {}}>zero false positive</b> promises</span>
                    <span style={isLight ? { color: '#444' } : {}}>Every documented claim has <b style={isLight ? { color: '#111' } : {}}>a test</b></span>
                    <span style={isLight ? { color: '#444' } : {}}>Paste JavaScript, TypeScript, React/JSX, HTML, or <b style={isLight ? { color: '#111' } : {}}>package.json</b></span>
                    <span style={isLight ? { color: '#444' } : {}}>Runs in a Web Worker with <b style={isLight ? { color: '#111' } : {}}>no network calls</b></span>
                </div>
            </div>
        </div>
    );
}

export function HeaderNav({ onOpenHistory }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const headerRef = useRef(null);

    const activePath = location.pathname;
    const isLight = activePath === '/privacy' || activePath === '/rules' || activePath === '/docs' || activePath === '/engine' || activePath === '/export' || activePath === '/tests';

    // Below 980px, .header-nav's own link row is display:none (see
    // landing.css) — this menu is the only way to reach Engine/Rules/
    // Privacy/Export/Tests/Docs at that width, not a bonus alongside the
    // hidden row, so it carries the exact same link set.
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleClickOutside = (e) => {
            if (headerRef.current && !headerRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mobileMenuOpen]);

    const linkStyle = (path) => {
        const isActive = activePath === path;
        if (isActive) {
            return {
                color: isLight ? 'var(--lav)' : 'var(--lav)',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
            };
        }
        return {
            color: isLight ? '#222' : '#cfcfcf',
            fontWeight: isLight ? 600 : 400,
            textDecoration: 'none'
        };
    };

    return (
        <>
            {/* position: sticky (from .site-header in landing.css, not overridden
                here) already establishes a containing block for the absolutely-
                positioned .mobile-nav-menu below — no extra position needed. */}
            <header ref={headerRef} className="site-header" style={{ background: 'transparent', border: 'none', borderBottom: 'none', boxShadow: 'none' }}>
                <Link className="brand" to="/" aria-label="XAUDIT">
                    <img src={logoXa} alt="XAUDIT Logo" className="brand-logo" />
                    <span className="brand-text" style={isLight ? { color: '#111' } : {}}>XAUDIT</span>
                </Link>

                <nav className="header-nav">
                    <Link to="/engine" style={linkStyle('/engine')}>
                        {activePath === '/engine' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--lav)', display: 'inline-block' }}></span>}
                        Engine
                    </Link>

                    <Link to="/rules" style={linkStyle('/rules')}>
                        {activePath === '/rules' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--lav)', display: 'inline-block' }}></span>}
                        Rules
                    </Link>

                    <Link to="/privacy" style={linkStyle('/privacy')}>
                        {activePath === '/privacy' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--lav)', display: 'inline-block' }}></span>}
                        Privacy
                    </Link>

                    <Link to="/export" style={linkStyle('/export')}>
                        {activePath === '/export' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--lav)', display: 'inline-block' }}></span>}
                        Export
                    </Link>

                    <Link to="/tests" style={linkStyle('/tests')}>
                        {activePath === '/tests' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--lav)', display: 'inline-block' }}></span>}
                        Tests
                    </Link>

                    <Link to="/docs" style={linkStyle('/docs')}>
                        {activePath === '/docs' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--lav)', display: 'inline-block' }}></span>}
                        Docs
                    </Link>

                    {activePath === '/check' && onOpenHistory && (
                        <button
                            onClick={onOpenHistory}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '999px',
                                background: 'transparent',
                                border: '1px solid var(--line)',
                                color: '#ccc',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                marginRight: '4px'
                            }}
                        >
                            Audit History
                        </button>
                    )}

                    <button
                        className="nav-start-audit-btn"
                        onClick={() => navigate('/check')}
                        style={isLight ? { background: '#161616', color: '#fff' } : {}}
                    >
                        <span>+</span> Start Audit
                    </button>
                </nav>

                <button
                    type="button"
                    className={`mobile-nav-toggle${isLight ? ' is-light' : ''}`}
                    aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen((open) => !open)}
                >
                    <span className="mobile-nav-toggle-bars">
                        <span className="mobile-nav-toggle-bar" style={{ transform: mobileMenuOpen ? 'translateY(6px) rotate(45deg)' : 'none' }} />
                        <span className="mobile-nav-toggle-bar" style={{ opacity: mobileMenuOpen ? 0 : 1 }} />
                        <span className="mobile-nav-toggle-bar" style={{ transform: mobileMenuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
                    </span>
                </button>

                {mobileMenuOpen && (
                    <div className={`mobile-nav-menu${isLight ? ' is-light' : ''}`}>
                        <Link to="/engine" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-item${isLight ? ' light-item' : ''}`} style={activePath === '/engine' ? { color: 'var(--lav)', fontWeight: 700 } : {}}>
                            Engine
                        </Link>
                        <Link to="/rules" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-item${isLight ? ' light-item' : ''}`} style={activePath === '/rules' ? { color: 'var(--lav)', fontWeight: 700 } : {}}>
                            Rules
                        </Link>
                        <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-item${isLight ? ' light-item' : ''}`} style={activePath === '/privacy' ? { color: 'var(--lav)', fontWeight: 700 } : {}}>
                            Privacy
                        </Link>
                        <Link to="/export" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-item${isLight ? ' light-item' : ''}`} style={activePath === '/export' ? { color: 'var(--lav)', fontWeight: 700 } : {}}>
                            Export
                        </Link>
                        <Link to="/tests" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-item${isLight ? ' light-item' : ''}`} style={activePath === '/tests' ? { color: 'var(--lav)', fontWeight: 700 } : {}}>
                            Tests
                        </Link>
                        <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className={`mobile-nav-item${isLight ? ' light-item' : ''}`} style={activePath === '/docs' ? { color: 'var(--lav)', fontWeight: 700 } : {}}>
                            Docs
                        </Link>

                        {activePath === '/check' && onOpenHistory && (
                            <button
                                type="button"
                                onClick={() => { setMobileMenuOpen(false); onOpenHistory(); }}
                                className={`mobile-nav-item${isLight ? ' light-item' : ''}`}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                            >
                                Audit History
                            </button>
                        )}

                        <div style={{ height: '1px', background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

                        <button
                            className="nav-start-audit-btn"
                            style={{ width: '100%', justifyContent: 'center', margin: 0, padding: '9px 16px' }}
                            onClick={() => { setMobileMenuOpen(false); navigate('/check'); }}
                        >
                            <span>+</span> Start Audit
                        </button>
                    </div>
                )}
            </header>
        </>
    );
}
