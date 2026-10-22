// Case 37 — a sanitizer wrapper imported from another file in the same
// project. Neither implementation should treat this as clean — it should
// stay high, classified as unsupported rather than silently trusted, even
// though the wrapper might genuinely call DOMPurify internally.
import { sanitizeForDisplay } from "./sanitizer-utils";

function render(el, userInput) {
    el.innerHTML = sanitizeForDisplay(userInput);
}
