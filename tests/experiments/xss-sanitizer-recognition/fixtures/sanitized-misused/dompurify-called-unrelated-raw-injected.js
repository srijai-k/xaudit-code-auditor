// Case 24 — DOMPurify.sanitize() is called somewhere in the file, but the
// actual sink uses a completely unrelated raw value. A real DOMPurify call
// existing anywhere in the file must never make an unrelated sink "clean."
import DOMPurify from "dompurify";

function logForAudit(x) {
    DOMPurify.sanitize(x); // called, but the result is discarded — unrelated to the sink below
}

function render(el, rawInput) {
    el.innerHTML = rawInput;
}
