// Case 16 — DOMPurify's default export imported under a different local name.
import sanitizeHtml from "dompurify";

function render(el, userInput) {
    el.innerHTML = sanitizeHtml(userInput);
}
