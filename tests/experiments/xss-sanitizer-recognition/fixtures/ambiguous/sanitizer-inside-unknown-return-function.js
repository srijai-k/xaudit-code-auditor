// Case 39 — DOMPurify.sanitize() is called inside a helper function, but the
// sink calls the helper, not DOMPurify directly. Both implementations
// correctly decline to trust an arbitrary function's return value.
import DOMPurify from "dompurify";

function maybeSanitize(x) {
    return DOMPurify.sanitize(x);
}

function render(el, userInput) {
    el.innerHTML = maybeSanitize(userInput);
}
