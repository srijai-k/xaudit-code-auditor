import React from 'react';

function headline({ fixed, stillThere, introduced }) {
    const before = fixed.length + stillThere.length;
    if (before === 0 && introduced.length === 0) return 'Nothing to compare. Neither version had any findings.';
    if (before === 0) return `The first version was clean. This one has ${introduced.length} new ${introduced.length === 1 ? 'problem' : 'problems'}.`;
    const fixedPart = fixed.length === before
        ? `Everything from the last check is gone.`
        : fixed.length === 0
            ? `None of the ${before} ${before === 1 ? 'problem was' : 'problems were'} fixed.`
            : `${fixed.length} of ${before} fixed. ${stillThere.length} still there.`;
    const newPart = introduced.length === 0
        ? (fixed.length === before ? ' Nothing new showed up either.' : '')
        : ` And ${introduced.length} new ${introduced.length === 1 ? 'one' : 'ones'} showed up.`;
    return fixedPart + newPart;
}

function List({ title, items, empty }) {
    return (
        <div>
            <h4>{title}</h4>
            {items.length === 0 ? (
                <p className="is-empty" style={{ margin: 0, fontSize: '13px' }}>{empty}</p>
            ) : (
                <ul>
                    {items.map((f, i) => (
                        <li key={i}>
                            {f.title} {f.location && <small>line {f.location.line}</small>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/** Before/after summary for "Check your AI's fix". */
export default function FixComparison({ comparison }) {
    const { fixed, stillThere, introduced } = comparison;
    return (
        <section className="fix-compare" aria-live="polite">
            <p className="eyebrow purple" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
                <span></span>Compared with your last check
            </p>
            <h3>{headline(comparison)}</h3>
            <p>Line numbers below are in the new version.</p>
            <div className="fix-compare-counts">
                <span className="is-fixed">{fixed.length} fixed</span>
                <span className="is-still">{stillThere.length} still there</span>
                <span className="is-new">{introduced.length} new</span>
            </div>
            <div className="fix-compare-lists">
                <List title="Fixed" items={fixed} empty="Nothing yet." />
                <List title="Still there" items={stillThere} empty="None." />
                <List title="New" items={introduced} empty="None." />
            </div>
            <p className="fix-compare-note">
                This compares what XAUDIT's rules can see, not what the code does. If your AI fixed something in a way that just moved the problem out of sight of the rules, it can look fixed here. Read the change too.
            </p>
        </section>
    );
}
