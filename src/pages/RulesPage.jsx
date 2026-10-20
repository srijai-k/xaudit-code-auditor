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
        behavior: 'Follows a value back one variable at most. High by default. Drops to Low if the value goes through something it recognizes as a sanitizer.'
    },
    {
        id: 'sqli',
        title: 'SQL Injection',
        severity: 'Always High',
        severityLevel: 'high',
        languages: ['JS', 'TS'],
        receiver: '.query(), .execute(), .raw() on DB-shaped receivers',
        behavior: 'A query built with + or a template string and handed to something that looks like a database. Always High. There is no such thing as a sanitized string query here.'
    },
    {
        id: 'secrets',
        title: 'Hardcoded Secrets',
        severity: 'Critical → Low',
        severityLevel: 'critical',
        languages: ['JS', 'TS', 'JSX', 'JSON'],
        receiver: 'OpenAI, Anthropic, Stripe, AWS, GitHub, GitLab, Slack, private keys, Google API keys',
        behavior: 'Known key formats first. Then anything assigned to a name like API_KEY or PASSWORD. Then, as a last resort, strings that just look too random to be anything else.'
    },
    {
        id: 'eval',
        title: 'Dynamic Execution',
        severity: 'Always High',
        severityLevel: 'high',
        languages: ['JS', 'TS', 'JSX'],
        receiver: 'eval(), new Function(), setTimeout("str"), setInterval("str")',
        behavior: 'Always High, even if the string is hardcoded. eval is eval.'
    },
    {
        id: 'exec',
        title: 'Node Command Patterns',
        severity: 'High',
        severityLevel: 'high',
        languages: ['JS', 'TS'],
        receiver: 'exec(), execSync() with non-literals, spawn() with shell: true',
        behavior: 'A shell command built from something that is not a fixed string. If any piece of it comes from a user, they get to run commands on your server.'
    },
    {
        id: 'auth',
        title: 'Weak Auth Patterns',
        severity: 'Medium',
        severityLevel: 'medium',
        languages: ['JS', 'TS'],
        receiver: 'Hardcoded credential string comparisons, jwt.decode() without verify()',
        behavior: 'Medium. A password checked against a string sitting right there in the code, or a JWT that gets read but never verified.'
    },
    {
        id: 'express',
        title: 'Express Request Input',
        severity: 'High → Medium',
        severityLevel: 'high',
        languages: ['JS', 'TS'],
        receiver: 'res.send(), res.redirect(), res.sendFile()/download(), fs.* paths, axios/got/http(s)/server fetch URLs',
        behavior: 'Only fires when something from the request (req.query, req.body, req.params, req.headers) reaches the call. Escaping it first, like escapeHtml() or path.basename(), stops the finding. Open redirects are Medium, the rest High.'
    },
    {
        id: 'deps',
        title: 'Dependency Hygiene',
        severity: 'Critical → Info',
        severityLevel: 'info',
        languages: ['JSON'],
        receiver: 'package.json dependencies & scripts',
        behavior: 'Versions set to * or latest, dependencies pulled straight from git or a URL, install scripts that pipe curl into bash, and dev tools sitting in dependencies. It does not check for CVEs.'
    },
    {
        id: 'html',
        title: 'HTML Hygiene',
        severity: 'Max Medium',
        severityLevel: 'medium',
        languages: ['HTML'],
        receiver: 'Viewport meta, alt text, inline event handlers, CSP meta tags',
        behavior: 'Tops out at Medium. This one is a text scan, not a real parse, so treat it as housekeeping.'
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
                            Rules
                        </div>
                        <h1 className="text-fade-in stagger-2" style={{ fontSize: 'clamp(44px, 5.5vw, 76px)', fontWeight: 400, color: '#111', margin: 0, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '980px', fontFamily: 'Telegraf, "Haffer SQ", Arial, sans-serif' }}>
                            Nine rules. Each one knows what it can't see.
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
                                This is everything XAUDIT checks for. Pick a rule below to see exactly what it looks for and how it decides how bad something is.
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
                                    <span style={{ fontSize: '18px' }}>+</span> Try it on your code
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
                                    title="Scroll down to the rules"
                                >
                                    ↓
                                </a>
                            </div>
                        </div>

                        {/* Metric Cards Grid */}
                        <div className="privacy-pills-grid" style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>9</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Rule Modules</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>234</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Tests</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>1 Hop</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>How far back it looks</div>
                            </div>
                            <div style={{ background: '#161616', color: '#fff', padding: '26px 28px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#cca7f3' }}>0 AI</div>
                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>Just rules</div>
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
                                    The rules, one at a time
                                </h2>
                                <p style={{ color: '#666', fontSize: '15px', margin: '6px 0 0' }}>
                                    Click one on the left. The details show up on the right.
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
                                            What it looks for
                                        </div>
                                        <code style={{ display: 'block', background: '#0a0a0a', padding: '14px 16px', borderRadius: '12px', color: '#e0e0e0', fontSize: '13px', lineHeight: 1.6, wordBreak: 'break-all' }}>
                                            {selectedRule.receiver}
                                        </code>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#cca7f3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                            How it decides
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
                            Under the hood
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 500, color: '#111', margin: '0 0 32px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                            Same code in, same findings out
                        </h2>

                        <div className="rules-grid-260" style={{ display: 'grid', gap: '24px' }}>
                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '10px' }}>01. AST Parsing</div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    Your code gets parsed into a syntax tree first, so the rules are looking at real structure and not just searching text.
                                </p>
                            </div>

                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '10px' }}>02. One step back</div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    If a risky call uses a variable, XAUDIT checks what that variable was set to. One step, no further.
                                </p>
                            </div>

                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '10px' }}>03. Sanitizer Checks</div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    Spots DOMPurify, sanitize-html and functions named sanitize, and lowers the severity. It goes by name, so a homemade function called sanitize() fools it too.
                                </p>
                            </div>

                            <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px', padding: '28px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '10px' }}>04. No score</div>
                                <p style={{ color: '#444', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    There's no grade at the end. A clean report means nothing matched. It doesn't mean nothing is wrong.
                                </p>
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
