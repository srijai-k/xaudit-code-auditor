// A small admin panel. The HTML for the "system notice" banner is fixed,
// static copy that a developer wrote — genuinely safe — but it passes
// through two intermediate variables (formattedNotice, then noticeHtml)
// before reaching the __html value, which the engine's one-hop tracing
// can't chase through (it resolves exactly one identifier hop). This is a
// KNOWN, ACCEPTED FALSE POSITIVE, documented on purpose, not a bug found by
// this file. See docs/model-improvements.md for a different, real bug this
// same file *did* surface: the whole `dangerouslySetInnerHTML={noticeProps}`
// object-as-a-variable pattern used here was entirely invisible to the rule
// before that fix (it only recognized an inline `{{ __html: ... }}` object
// literal) — now fixed, which is why this case reaches the two-hop limit
// at all instead of being missed outright.
export default function AdminPanel({ stats }) {
    const noticeHtml = "<strong>Scheduled maintenance</strong> this Sunday, 2–4am UTC.";
    const formattedNotice = noticeHtml;
    const noticeProps = { __html: formattedNotice };

    return (
        <div className="admin-panel">
            <div className="notice" dangerouslySetInnerHTML={noticeProps} />
            <dl>
                <dt>Active users</dt>
                <dd>{stats.activeUsers}</dd>
            </dl>
        </div>
    );
}
