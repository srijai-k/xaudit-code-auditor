// Case 19 — one value sanitized, a second, unrelated raw value injected too.
import DOMPurify from "dompurify";

function render(el, title, rawSubtitle) {
    const cleanTitle = DOMPurify.sanitize(title);
    el.innerHTML = `<h1>${cleanTitle}</h1><h2>${rawSubtitle}</h2>`;
}
