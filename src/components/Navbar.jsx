import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoXa from '../assets/logo-xa.png';

export function TopTicker() {
    const location = useLocation();
    const isLight = location.pathname === '/privacy' || location.pathname === '/rules';

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const activePath = location.pathname;
    const isHome = activePath === '/';
    const isLight = activePath === '/privacy' || activePath === '/rules';

    const getAnchor = (id) => (isHome ? `#${id}` : `/#${id}`);

    const handleSectionClick = (e, sectionId) => {
        e.preventDefault();
        closeMenu();
        if (isHome) {
            const el = document.getElementById(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(`/#${sectionId}`);
        }
    };

    const linkStyle = (path) => {
        const isActive = activePath === path;
        if (isActive) {
            return {
                color: isLight ? '#7c3aed' : 'var(--lav)',
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
                    <a href={getAnchor('engine')} onClick={(e) => handleSectionClick(e, 'engine')} style={isLight ? { color: '#222', fontWeight: 600 } : {}}>
                        Engine
                    </a>
                    
                    <Link to="/rules" style={linkStyle('/rules')}>
                        {activePath === '/rules' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>}
                        Rules
                    </Link>

                    <Link to="/privacy" style={linkStyle('/privacy')}>
                        {activePath === '/privacy' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>}
                        Privacy
                    </Link>

                    <a href={getAnchor('exports')} onClick={(e) => handleSectionClick(e, 'exports')} style={isLight ? { color: '#222', fontWeight: 600 } : {}}>
                        Export
                    </a>
                    
                    <a href={getAnchor('tests')} onClick={(e) => handleSectionClick(e, 'tests')} style={isLight ? { color: '#222', fontWeight: 600 } : {}}>
                        Tests
                    </a>

                    <Link to="/docs" style={linkStyle('/docs')}>
                        {activePath === '/docs' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>}
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
                    className={`menu-pill ${isMenuOpen ? 'is-open' : ''}`} 
                    aria-expanded={isMenuOpen} 
                    onClick={toggleMenu}
                    style={isLight ? { background: '#161616', color: '#fff' } : {}}
                >
                    <span></span><em>{isMenuOpen ? 'Close' : 'Menu'}</em>
                </button>
            </header>

            <aside className={`menu-panel ${isMenuOpen ? 'is-open' : ''}`} id="menuPanel" aria-hidden={!isMenuOpen}>
                <a href={getAnchor('engine')} onClick={(e) => handleSectionClick(e, 'engine')}>Engine</a>
                <Link to="/rules" onClick={closeMenu}>● Rules</Link>
                <Link to="/privacy" onClick={closeMenu}>● Privacy</Link>
                <a href={getAnchor('exports')} onClick={(e) => handleSectionClick(e, 'exports')}>Export</a>
                <a href={getAnchor('tests')} onClick={(e) => handleSectionClick(e, 'tests')}>Tests</a>
                <Link to="/docs" onClick={closeMenu}>Docs</Link>
                {activePath === '/check' && onOpenHistory && (
                    <button
                        onClick={() => { closeMenu(); onOpenHistory(); }}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--line)',
                            color: '#fff',
                            padding: '10px 18px',
                            borderRadius: '999px',
                            margin: '10px 0',
                            width: '100%',
                            fontWeight: 700
                        }}
                    >
                        Audit History
                    </button>
                )}
                <button
                    className="nav-start-audit-btn"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                    onClick={() => { closeMenu(); navigate('/check'); }}
                >
                    <span>+</span> Start Audit
                </button>
            </aside>
        </>
    );
}

// Standalone Global Floating Scroll Navbar Component (Rendered at root outside CSS transformed containers)
export function FloatingScrollNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showFloatingNav, setShowFloatingNav] = useState(false);
    const [isFloatingOpen, setIsFloatingOpen] = useState(false);

    // Dev Control for Top Position (persisted in localStorage)
    const [floatingTopOffset, setFloatingTopOffset] = useState(() => {
        const saved = localStorage.getItem('xaudit_floating_nav_top');
        return saved ? parseInt(saved, 10) : 64;
    });

    // Dev Control for Right Position (persisted in localStorage)
    const [floatingRightOffset, setFloatingRightOffset] = useState(() => {
        const saved = localStorage.getItem('xaudit_floating_nav_right');
        return saved ? parseInt(saved, 10) : 24;
    });

    const floatingRef = useRef(null);

    // Scroll listener: Only show floating nav when top header navbar is scrolled out of view (>120px)
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 120) {
                setShowFloatingNav(true);
            } else {
                setShowFloatingNav(false);
                setIsFloatingOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
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

    // Keyboard Dev Controls: Shift + Arrow keys (Up, Down, Left, Right)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.shiftKey) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFloatingTopOffset(prev => {
                        const next = Math.max(0, prev - 2);
                        localStorage.setItem('xaudit_floating_nav_top', next.toString());
                        return next;
                    });
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFloatingTopOffset(prev => {
                        const next = Math.min(600, prev + 2);
                        localStorage.setItem('xaudit_floating_nav_top', next.toString());
                        return next;
                    });
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setFloatingRightOffset(prev => {
                        const next = Math.min(1200, prev + 2);
                        localStorage.setItem('xaudit_floating_nav_right', next.toString());
                        return next;
                    });
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setFloatingRightOffset(prev => {
                        const next = Math.max(0, prev - 2);
                        localStorage.setItem('xaudit_floating_nav_right', next.toString());
                        return next;
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const activePath = location.pathname;
    const isHome = activePath === '/';
    const isLight = activePath === '/privacy' || activePath === '/rules';

    const getAnchor = (id) => (isHome ? `#${id}` : `/#${id}`);

    const handleSectionClick = (e, sectionId) => {
        e.preventDefault();
        setIsFloatingOpen(false);
        if (isHome) {
            const el = document.getElementById(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(`/#${sectionId}`);
        }
    };

    const adjustTopOffset = (delta) => {
        setFloatingTopOffset(prev => {
            const next = Math.max(0, Math.min(600, prev + delta));
            localStorage.setItem('xaudit_floating_nav_top', next.toString());
            return next;
        });
    };

    const adjustRightOffset = (delta) => {
        setFloatingRightOffset(prev => {
            const next = Math.max(0, Math.min(1200, prev + delta));
            localStorage.setItem('xaudit_floating_nav_right', next.toString());
            return next;
        });
    };

    return (
        <>
            {/* Floating Right Mini Dropdown Navbar - FIXED TO VIEWPORT, SHOWN WHEN SCROLLED PAST NAVBAR */}
            <div
                ref={floatingRef}
                className="floating-scroll-nav"
                style={{
                    position: 'fixed',
                    top: `${floatingTopOffset}px`,
                    right: `${floatingRightOffset}px`,
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
                            <a
                                href={getAnchor('engine')}
                                onClick={(e) => handleSectionClick(e, 'engine')}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                            >
                                Engine
                            </a>
                            <Link
                                to="/rules"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/rules' ? { color: '#7c3aed', fontWeight: 700 } : {}}
                            >
                                Rules
                            </Link>
                            <Link
                                to="/privacy"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/privacy' ? { color: '#7c3aed', fontWeight: 700 } : {}}
                            >
                                Privacy
                            </Link>
                            <a
                                href={getAnchor('exports')}
                                onClick={(e) => handleSectionClick(e, 'exports')}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                            >
                                Export
                            </a>
                            <a
                                href={getAnchor('tests')}
                                onClick={(e) => handleSectionClick(e, 'tests')}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                            >
                                Tests
                            </a>
                            <Link
                                to="/docs"
                                onClick={() => setIsFloatingOpen(false)}
                                className={`floating-nav-item ${isLight ? 'light-item' : ''}`}
                                style={activePath === '/docs' ? { color: '#7c3aed', fontWeight: 700 } : {}}
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
