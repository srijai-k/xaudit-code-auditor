// Case 36 — destructured { sanitize } from DOMPurify, then called bare.
// Genuinely the real DOMPurify.sanitize function under the hood, but the
// narrow structural check has no way to see through a destructuring
// pattern back to "DOMPurify" — an intentional, disclosed gap.
import DOMPurify from "dompurify";

function render(el, userInput) {
    const { sanitize } = DOMPurify;
    el.innerHTML = sanitize(userInput);
}
