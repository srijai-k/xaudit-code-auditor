import React from 'react';

// Fixed status colors (dark-surface steps) — never themed, never reused for
// anything but severity. See the dataviz skill's palette.md "Status palette".
// info isn't a threat level, so it gets the neutral muted-ink tone instead
// of a status color — it's not "good", it's just non-alarming.
const SEVERITY_BAR = {
    critical: { color: '#d03b3b', label: 'Critical' },
    high: { color: '#ec835a', label: 'High' },
    medium: { color: '#fab219', label: 'Medium' },
    low: { color: '#0ca30c', label: 'Low' },
    info: { color: '#898781', label: 'Info' },
};
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

// One neutral accent for category bars — these are "which checklist item
// fired," not a severity/status dimension, so a single hue (sequential
// slot 1) is correct rather than a rainbow per category.
const CATEGORY_COLOR = '#3987e5';
const CATEGORY_LABELS = {
    xss: 'XSS / Unsafe HTML',
    'dynamic-exec': 'Dynamic Execution',
    sqli: 'SQL Injection',
    secrets: 'Hardcoded Secrets',
    'node-command': 'Node Command Patterns',
    html: 'HTML Hygiene',
};

/** One horizontal bar row: label, proportional fill, count at the tip. */
function BarRow({ label, count, max, color }) {
    const pct = max > 0 ? Math.max(count > 0 ? 4 : 0, (count / max) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <div className="w-36 shrink-0 text-xs text-gray-400 text-right">{label}</div>
            <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: count > 0 ? color : 'transparent' }}
                />
            </div>
            <div className="w-6 shrink-0 text-xs font-bold text-gray-300 tabular-nums">{count}</div>
        </div>
    );
}

/**
 * The "proper report" overview: real counts as proportional bars, not a
 * fabricated risk score. Severity bars always show all 5 levels (so
 * "0 critical" is visible, not just absent). Category bars only show rule
 * groups that actually ran for this input (from result.rulesRun) — never a
 * category that wasn't checked, which would misrepresent coverage.
 */
export default function ReportOverview({ result }) {
    const counts = result.countsBySeverity;
    const maxSeverity = Math.max(1, ...SEVERITY_ORDER.map((s) => counts[s] ?? 0));

    const ranCategories = [...new Set((result.rulesRun || []).map((r) => r.ruleId))].filter((id) => CATEGORY_LABELS[id]);
    const categoryCounts = Object.fromEntries(
        ranCategories.map((cat) => [cat, result.findings.filter((f) => f.category === cat).length]),
    );
    const maxCategory = Math.max(1, ...Object.values(categoryCounts));

    return (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="border border-white/10 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">By severity</div>
                <div className="space-y-2.5">
                    {SEVERITY_ORDER.map((sev) => (
                        <BarRow key={sev} label={SEVERITY_BAR[sev].label} count={counts[sev] ?? 0} max={maxSeverity} color={SEVERITY_BAR[sev].color} />
                    ))}
                </div>
            </div>

            <div className="border border-white/10 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">By check (only what ran on this input)</div>
                <div className="space-y-2.5">
                    {ranCategories.length === 0 ? (
                        <div className="text-xs text-gray-600 italic">No rule groups recorded for this run.</div>
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
