// Case 11 — innerHTML wrapped directly in DOMPurify.sanitize() at the sink.
import DOMPurify from "dompurify";

function render(el, userInput) {
    el.innerHTML = DOMPurify.sanitize(userInput);
}
