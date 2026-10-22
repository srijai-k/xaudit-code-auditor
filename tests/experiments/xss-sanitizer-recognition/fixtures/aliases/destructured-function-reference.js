// Case 35 — the sanitize function itself extracted into a variable, then
// invoked at the sink. The call at the sink is `clean(userInput)`, not a
// `DOMPurify.sanitize(...)` shape, so this is intentionally unrecognized —
// the same "do not resolve arbitrary wrapper functions" scoping rule.
import DOMPurify from "dompurify";

function render(el, userInput) {
    const clean = DOMPurify.sanitize;
    el.innerHTML = clean(userInput);
}
