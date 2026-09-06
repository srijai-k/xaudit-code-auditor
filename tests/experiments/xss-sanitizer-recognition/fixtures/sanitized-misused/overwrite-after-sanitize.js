// Case 23 — a sanitized value is immediately overwritten with a raw one.
// `html` is reassigned, so resolveSingleAssignment's binding.constant check
// already refuses to resolve it in baseline — this should stay high in
// both implementations without any sanitizer-recognition change at all.
import DOMPurify from "dompurify";

function render(el, userInput) {
    let html = DOMPurify.sanitize(userInput);
    html = userInput; // overwritten with the raw value right after
    el.innerHTML = html;
}
