// Case 40 — deliberately malformed JSX (mismatched tag) so this file fails
// to parse. Both implementations must fail identically at the parse stage,
// before either rule ever runs — scored separately as a parser error, never
// folded into TP/FP/FN.
function Comment({ body }) {
    return <div dangerouslySetInnerHTML={{ __html: body }}</div>;
}
