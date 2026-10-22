// Case 34 — DOMPurify reassigned to a local variable before being called.
// Real DOMPurify (e.g. loaded as a global via a <script> tag), but the
// alias itself is untraceable to "DOMPurify" or a verified import by this
// rule's narrow, structural scope — an intentional, disclosed gap, not a
// claim that this code is actually unsafe.
import DOMPurify from "dompurify";

function render(el, userInput) {
    const purifier = DOMPurify;
    el.innerHTML = purifier.sanitize(userInput);
}
