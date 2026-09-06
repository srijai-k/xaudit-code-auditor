// Case 17 — DOMPurify imported as a namespace.
import * as DOMPurify from "dompurify";

function render(el, userInput) {
    el.innerHTML = DOMPurify.sanitize(userInput);
}
