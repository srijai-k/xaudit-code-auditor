import React from 'react';

const SEVERITY_BAR = {
    critical: { color: '#ef4444', label: 'Critical' },
    high: { color: '#f97316', label: 'High' },
    medium: { color: '#eab308', label: 'Medium' },
    low: { color: '#10b981', label: 'Low' },
    info: { color: '#a78bfa', label: 'Info' },
};
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

// Lavender theme accent matching landing page design system
const CATEGORY_COLOR = '#a78bfa';

const CATEGORY_LABELS = {
    xss: 'XSS / Unsafe HTML',
    'dynamic-exec': 'Dynamic Execution',
    sqli: 'SQL Injection',
    secrets: 'Hardcoded Secrets',
    'node-command': 'Node Command Patterns',
    auth: 'Weak Authentication',
    'dependency-hygiene': 'Dependency Hygiene',
    html: 'HTML Hygiene',
};

function BarRow({ label, count, max, color }) {
    const pct = max > 0 ? Math.max(count > 0 ? 5 : 0, (count / max) * 100) : 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '160px', shrink: 0, fontSize: '12px', color: '#aaa', fontWeight: 600, textAlign: 'right' }}>
                {label}
            </div>
            <div style={{ flex: 1, height: '14px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden', padding: '1px' }}>
                <div
                    style={{
                        height: '100%',
                        borderRadius: '999px',
                        width: `${pct}%`,
                        backgroundColor: count > 0 ? color : 'transparent',
                        transition: 'width 0.5s ease, background-color 0.3s ease',
                    }}
                />
            </div>
            <div style={{ width: '24px', shrink: 0, fontSize: '13px', fontWeight: 800, color: count > 0 ? '#fff' : '#555', textAlign: 'right', fontFamily: 'monospace' }}>
                {count}
            </div>
        </div>
    );
}

export default function ReportOverview({ result }) {
    const counts = result.countsBySeverity;
    const maxSeverity = Math.max(1, ...SEVERITY_ORDER.map((s) => counts[s] ?? 0));

    const ranCategories = [...new Set((result.rulesRun || []).map((r) => r.ruleId))].filter((id) => CATEGORY_LABELS[id]);
    const categoryCounts = Object.fromEntries(
        ranCategories.map((cat) => [cat, result.findings.filter((f) => f.category === cat).length]),
    );
    const maxCategory = Math.max(1, ...Object.values(categoryCounts));

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* By Severity Panel */}
            <div style={{ background: '#161616', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px' }}>
                <p className="eyebrow purple" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '18px' }}>
                    <span></span>By Severity
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {SEVERITY_ORDER.map((sev) => (
                        <BarRow key={sev} label={SEVERITY_BAR[sev].label} count={counts[sev] ?? 0} max={maxSeverity} color={SEVERITY_BAR[sev].color} />
                    ))}
                </div>
            </div>

            {/* By Check Panel */}
            <div style={{ background: '#161616', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px' }}>
                <p className="eyebrow purple" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '18px' }}>
                    <span></span>By Check (Only What Ran On This Input)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {ranCategories.length === 0 ? (
                        <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', padding: '12px 0' }}>
                            No rule groups recorded for this run.
                        </div>
                    ) : (
                        ranCategories.map((cat) => (
                            <BarRow key={cat} label={CATEGORY_LABELS[cat]} count={categoryCounts[cat]} max={maxCategory} color={CATEGORY_COLOR} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
