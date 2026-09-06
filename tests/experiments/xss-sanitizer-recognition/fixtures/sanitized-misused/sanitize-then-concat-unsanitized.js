// Case 18 — sanitized value concatenated with unsanitized user input afterward.
// Must remain high in both baseline and experimental: the sink's effective
// value is a BinaryExpression, never a bare sanitizer CallExpression.
import DOMPurify from "dompurify";

function render(el, comment, rawSignature) {
    const clean = DOMPurify.sanitize(comment);
    el.innerHTML = clean + rawSignature;
}
