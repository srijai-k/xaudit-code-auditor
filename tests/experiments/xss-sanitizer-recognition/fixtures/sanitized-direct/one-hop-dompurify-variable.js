// Case 15 — DOMPurify.sanitize() result stored in a variable, one hop before the sink.
import DOMPurify from "dompurify";

function render(el, userInput) {
    const clean = DOMPurify.sanitize(userInput);
    el.innerHTML = clean;
}
