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

    const activePath = location.pathname;
    const isLight = activePath === '/privacy' || activePath === '/rules' || activePath === '/docs' || activePath === '/engine' || activePath === '/export' || activePath === '/tests';

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
            <header className="site-header" style={{ background: 'transparent', border: 'none', borderBottom: 'none', boxShadow: 'none' }}>
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
            </header>
        </>
    );
}

// Standalone Global Floating Scroll Navbar Component (Rendered at root outside CSS transformed containers)
// Fixed position for the floating nav — was previously adjustable at
// runtime via a Shift+Arrow dev control persisted to localStorage; that
// was a design-time tuning aid, not something that belonged in shipped
// code, so the values it converged on are now just hardcoded here.
const FLOATING_NAV_TOP = 64;
const FLOATING_NAV_RIGHT = 24;

export function FloatingScrollNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showFloatingNav, setShowFloatingNav] = useState(false);
    const [isFloatingOpen, setIsFloatingOpen] = useState(false);
    const floatingRef = useRef(null);

    // On mobile (where the header's own link row is hidden by CSS below
    // 980px) this is the only nav, so it stays visible throughout the
    // page rather than waiting for a scroll past the header — that
    // scroll-gated reveal is kept for desktop only, where the header's
    // full nav is already on screen at the top.
    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width: 980px)');

        const handleVisibility = () => {
            if (mobileQuery.matches || window.scrollY > 120) {
                setShowFloatingNav(true);
            } else {
                setShowFloatingNav(false);
                setIsFloatingOpen(false);
            }
        };

        window.addEventListener('scroll', handleVisibility, { passive: true });
        mobileQuery.addEventListener('change', handleVisibility);
        handleVisibility();
        return () => {
            window.removeEventListener('scroll', handleVisibility);
            mobileQuery.removeEventListener('change', handleVisibility);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (floatingRef.current && !floatingRef.current.contains(e.target)) {
                setIsFloatingOpen(false);
            }
        };
        if (isFloatingOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFloatingOpen]);

    const activePath = location.pathname;
    const isLight = activePath === '/privacy' || activePath === '/rules' || activePath === '/docs' || activePath === '/engine' || activePath === '/export' || activePath === '/tests';

    return (
        <>
            {/* Floating Right Mini Dropdown Navbar - FIXED TO VIEWPORT, SHOWN WHEN SCROLLED PAST NAVBAR */}
            <div
                ref={floatingRef}
                className="floating-scroll-nav"
                style={{
                    position: 'fixed',
                    top: `${FLOATING_NAV_TOP}px`,
                    right: `${FLOATING_NAV_RIGHT}px`,
                    zIndex: 9999,
                    pointerEvents: showFloatingNav ? 'auto' : 'none',
                    opacity: showFloatingNav ? 1 : 0,
                    transform: showFloatingNav ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.95)',
                    transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), top 0.15s ease-out, right 0.15s ease-out'
                }}
            >
                {/* Trigger Button (Logo Removed) */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsFloatingOpen(!isFloatingOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            padding: '9px 18px',
                            borderRadius: '999px',
                            background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(24, 24, 28, 0.92)',
                            color: isLight ? '#111' : '#fff',
                            border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.14)',
                            backdropFilter: 'blur(16px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28)',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {/* 3 Horizontal Bars Hamburger Icon */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '14px', height: '12px', justifyContent: 'center' }}>
                            <span style={{
                                display: 'block',
                                height: '2px',
                                width: '100%',
                                background: 'currentColor',
                                borderRadius: '1px',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: isFloatingOpen ? 'translateY(5px) rotate(45deg)' : 'none'
                            }} />
                            <span style={{
                                display: 'block',
                                height: '2px',
                                width: '100%',
                                background: 'currentColor',
                                borderRadius: '1px',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                opacity: isFloatingOpen ? 0 : 1
                            }} />
                            <span style={{
                                display: 'block',
                                height: '2px',
                                width: '100%',
                                background: 'currentColor',
                                borderRadius: '1px',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: isFloatingOpen ? 'translateY(-5px) rotate(-45deg)' : 'none'
                            }} />
                        </div>
                        <span>Navigation</span>
                    </button>

                    {/* Dropdown Menu Card */}
                    {isFloatingOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                width: '230px',
                                background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 20, 24, 0.96)',
                                border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.14)',
                                borderRadius: '18px',
                                padding: '10px',
                                boxShadow: '0 18px 48px rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(20px)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                animation: 'textFadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                            }}
                        >
                            <Link
                                to="/engine"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/engine' ? { color: 'var(--lav)', fontWeight: 700 } : {}}
                            >
                                Engine
                            </Link>
                            <Link
                                to="/rules"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/rules' ? { color: 'var(--lav)', fontWeight: 700 } : {}}
                            >
                                Rules
                            </Link>
                            <Link
                                to="/privacy"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/privacy' ? { color: 'var(--lav)', fontWeight: 700 } : {}}
                            >
                                Privacy
                            </Link>
                            <Link
                                to="/export"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/export' ? { color: 'var(--lav)', fontWeight: 700 } : {}}
                            >
                                Export
                            </Link>
                            <Link
                                to="/tests"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/tests' ? { color: 'var(--lav)', fontWeight: 700 } : {}}
                            >
                                Tests
                            </Link>
                            <Link
                                to="/docs"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/docs' ? { color: 'var(--lav)', fontWeight: 700 } : {}}
                            >
                                Docs
                            </Link>

                            <div style={{ height: '1px', background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

                            <button
                                className="nav-start-audit-btn"
                                style={{ width: '100%', justifyContent: 'center', margin: 0, padding: '9px 16px' }}
                                onClick={() => { setIsFloatingOpen(false); navigate('/check'); }}
                            >
                                <span>+</span> Start Audit
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
