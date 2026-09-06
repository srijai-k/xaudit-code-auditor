// Case 08 — jQuery .html() with dynamic, unsanitized input.
//
// Note on construction: an earlier draft of this fixture used a bare
// $-prefixed PARAMETER as the chain root (`function renderBio($container, bio) {
// $container.find(".bio").html(bio); }`). Running the frozen baseline against
// that draft, before this file was finalized, surfaced that xss.ts's
// isJqueryRootedChain() only resolves a `this.$name`-property chain or a
// direct `$(...)`/`jQuery(...)` call as the chain root — a bare `$`-prefixed
// *parameter* used as the root of a `.find(...).html(...)` chain is not
// resolved, so that shape produced zero findings. That is a real,
// pre-existing gap in jQuery receiver detection, unrelated to DOMPurify
// recognition (the subject of this experiment) — out of scope to fix here
// per this experiment's non-negotiable rule against touching unrelated
// rules, and not a critical/security-relevant bug (it is a narrowing of an
// already-narrow, disclosed, name/shape-based heuristic, not a new class of
// miss). Flagged to the user rather than silently fixed. This fixture was
// changed, before the corpus was frozen, to the `this.$container`-property
// shape that IS supported, so this case actually tests what it claims to:
// an unsafe jQuery .html() call that both implementations must flag high.
function renderBio(bio) {
    this.$container.find(".bio").html(bio);
}
