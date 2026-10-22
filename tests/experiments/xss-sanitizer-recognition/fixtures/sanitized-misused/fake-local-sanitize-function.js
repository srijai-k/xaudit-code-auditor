// Case 21 — a local, same-file function merely NAMED "sanitize" that does
// nothing. Baseline's bare-identifier-name matching (SANITIZER_CALLEE_NAMES)
// trusts this by name alone. The narrow experimental rule must not.
function sanitize(x) {
    return x; // no-op — NOT a real sanitizer
}

function render(el, userInput) {
    el.innerHTML = sanitize(userInput);
}
