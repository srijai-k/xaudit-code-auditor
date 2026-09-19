import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import '../landing.css';

const RULE_MODULES = [
    {
        id: 'xss',
        title: 'DOM XSS',
        severity: 'High → Low',
        severityLevel: 'high',
        languages: ['JS', 'TS', 'JSX'],
        receiver: 'innerHTML, outerHTML, srcdoc, insertAdjacentHTML, document.write, dangerouslySetInnerHTML, $.html()',
        behavior: 'Traced back max 1 variable hop. High severity by default, downgraded to Low behind recognized sanitizer functions.'
    },
    {
        id: 'sqli',
        title: 'SQL Injection',
        severity: 'Always High',
        severityLevel: 'high',
        languages: ['JS', 'TS'],
        receiver: '.query(), .execute(), .raw() on DB-shaped receivers',
        behavior: 'Concatenation/interpolation reaching SQL query execution methods. Always High — no sanitizer-downgrade path exists.'
    },
    {
        id: 'secrets',
        title: 'Hardcoded Secrets',
        severity: 'Critical → Low',
        severityLevel: 'critical',
        languages: ['JS', 'TS', 'JSX', 'JSON'],
        receiver: 'OpenAI, Anthropic, Stripe, AWS, GitHub, GitLab, Slack, private keys, Google API keys',
        behavior: 'Vendor-prefixed regex formats + name-context fallback + calibrated Shannon entropy check.'
    },
    {
        id: 'eval',
        title: 'Dynamic Execution',
        severity: 'Always High',
        severityLevel: 'high',
        languages: ['JS', 'TS', 'JSX'],
        receiver: 'eval(), new Function(), setTimeout("str"), setInterval("str")',
        behavior: 'Always High severity, even when invoked on a fixed string literal.'
    },
    {
        id: 'exec',
        title: 'Node Command Patterns',
        severity: 'High',
        severityLevel: 'high',
        languages: ['JS', 'TS'],
        receiver: 'exec(), execSync() with non-literals, spawn() with shell: true',
        behavior: 'Detects unsafe child process execution with potential OS command injection parameters.'
    },
    {
        id: 'auth',
        title: 'Weak Auth Patterns',
        severity: 'Medium',
        severityLevel: 'medium',
        languages: ['JS', 'TS'],
        receiver: 'Hardcoded credential string comparisons, jwt.decode() without verify()',
        behavior: 'Medium severity finding targeting dangerous auth token handling and hardcoded password checks.'
    },
    {
        id: 'deps',
        title: 'Dependency Hygiene',
        severity: 'Critical → Info',
        severityLevel: 'info',
        languages: ['JSON'],
        receiver: 'package.json dependencies & scripts',
        behavior: 'Unpinned versions (*, ^, ~), non-registry git/http URLs, suspicious install scripts, misplaced dev tools.'
    },
    {
        id: 'html',
        title: 'HTML Hygiene',
        severity: 'Max Medium',
        severityLevel: 'medium',
        languages: ['HTML'],
        receiver: 'Viewport meta, alt text, inline event handlers, CSP meta tags',
        behavior: 'Tops out at Medium severity — regex/DOM parsed, explicitly non-AST based, not security-grade.'
    }
];

export default function RulesPage() {
    const navigate = useNavigate();
    const [activeRuleId, setActiveRuleId] = useState('xss');

    const selectedRule = RULE_MODULES.find(r => r.id === activeRuleId) || RULE_MODULES[0];

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
                            About Rules
                        </div>
                        <h1 className="text-fade-in stagger-2" style={{ fontSize: 'clamp(44px, 5.5vw, 76px)', fontWeight: 400, color: '#111', margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '980px', fontFamily: 'Telegraf, "Haffer SQ", Arial, sans-serif' }}>
                            A narrow set of checks, done honestly.
                        </h1>
                    </div>

                    {/* Hero Split: Accent Lavender Card + Dark Feature Pills */}
                    <div className="rules-grid-360" style={{
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
                                The eight rule modules, each with its scope and severity ceiling. Select any rule module below to inspect target receivers, AST traversal depth, and sanitizer downgrade paths.
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
                                    <span style={{ fontSize: '18px' }}>+</span> Explore Rule Suite
                                </button>
                                <a
                                    href="#rule-explorer"
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
                                    title="Scroll to interactive rule explorer"
                                >
                                    ↓
                                </a>
                            </div>
                        </div>

                        {/* Metric Cards Grid */}
                        <div className="privacy-pills-grid" style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>8</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Rule Modules</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>209</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Passing Tests</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>1 Hop</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Max Variable Depth</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>0 AI</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>No Hallucinations</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div id="rule-explorer" className="privacy-content-pad" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

                    {/* Interactive Dual-Column Rule Inspector */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
                            <div>
                                <h2 style={{ fontSize: '32px', fontWeight: 500, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
                                    Interactive Rule Module Explorer
                                </h2>
                                <p style={{ color: '#666', fontSize: '15px', margin: '6px 0 0' }}>
                                    Click a module on the left to view technical parameters and evaluation scope on the right.
                                </p>
                            </div>
                        </div>

                        <div className="rules-grid-320" style={{ display: 'grid', gap: '32px' }}>
                            {/* Left Side Module Selector List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {RULE_MODULES.map((rule) => {
                                    const isActive = rule.id === activeRuleId;
                                    return (
                                        <button
                                            key={rule.id}
                                            onClick={() => setActiveRuleId(rule.id)}
                                            style={{
                                                padding: '16px 20px',
                                                borderRadius: '16px',
                                                border: isActive ? '2px solid #7c3aed' : '1px solid rgba(0, 0, 0, 0.08)',
                                                background: isActive ? '#161616' : '#f8f7f4',
                                                color: isActive ? '#ffffff' : '#333333',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justify: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s ease',
                                                boxShadow: isActive ? '0 6px 18px rgba(124, 58, 237, 0.15)' : 'none'
                                            }}
                                        >
                                            <span style={{ fontWeight: 700, fontSize: '16px' }}>{rule.title}</span>
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                padding: '4px 10px',
                                                borderRadius: '999px',
                                                background: isActive ? '#cca7f3' : 'rgba(0,0,0,0.06)',
                                                color: isActive ? '#161616' : '#666'
                                            }}>
                                                {rule.severity}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right Side Technical Parameters Panel */}
                            <div style={{
                                background: '#161616',
                                color: '#ffffff',
                                borderRadius: '24px',
                                padding: '36px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '24px'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            background: '#cca7f3',
                                            color: '#161616',
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            textTransform: 'uppercase'
                                        }}>
                                            {selectedRule.severity}
                                        </span>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {selectedRule.languages.map(lang => (
                                                <span key={lang} style={{ fontSize: '12px', color: '#aaa', background: '#262626', padding: '2px 8px', borderRadius: '4px' }}>
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '32px', fontWeight: 400, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                                        {selectedRule.title}
                                    </h3>

                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                            Target Receiver Syntax
                                        </div>
                                        <code style={{ display: 'block', background: '#0a0a0a', padding: '14px 16px', borderRadius: '12px', color: '#e0e0e0', fontSize: '13px', lineHeight: 1.6, wordBreak: 'break-all' }}>
                                            {selectedRule.receiver}
                                        </code>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                            Evaluation Logic & Downgrade Path
                                        </div>
                                        <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.65, margin: 0, overflowWrap: 'anywhere' }}>
                                            {selectedRule.behavior}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/check')}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        background: '#cca7f3',
                                        color: '#161616',
                                        border: 'none',
                                        fontWeight: 800,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'center'
                                    }}
                                >
                                    Test {selectedRule.title} In Live Inspector →
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Architecture Pillars */}
                    <section className="privacy-card" style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '14px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                            Deterministic Contract
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            The Architecture Guarantee
                        </h2>

                        <div className="rules-grid-260" style={{ display: 'grid', gap: '24px' }}>
                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '10px' }}>01. AST Parsing</div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    JavaScript, TypeScript, and JSX are parsed into a full Abstract Syntax Tree before rules evaluate node relationships.
                                </p>
                            </div>

                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '10px' }}>02. 1-Hop Tracing</div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    Tracks variable assignments back exactly 1 step to determine if untrusted input reaches a dangerous receiver.
                                </p>
                            </div>

                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '10px' }}>03. Sanitizer Checks</div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    Recognizes DOMPurify, sanitizeHtml, and custom sanitizer wrappers to safely downgrade finding severity.
                                </p>
                            </div>

                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '10px' }}>04. No Risk Theater</div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    No letter grades, no arbitrary scores, and no false promises of 100% vulnerability coverage.
                                </p>
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
                </div>
            </main>
        </div>
    );
}
