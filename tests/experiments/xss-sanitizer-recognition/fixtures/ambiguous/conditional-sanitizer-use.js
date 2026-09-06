// Case 38 — sanitizer used only on one branch of a ternary. The resolved
// initializer is a ConditionalExpression, not a bare sanitizer call, so
// this correctly stays high in both implementations — the safe default
// when a value might not actually be sanitized at runtime.
import DOMPurify from "dompurify";

function render(el, userInput, trusted) {
    const clean = trusted ? userInput : DOMPurify.sanitize(userInput);
    el.innerHTML = clean;
}
