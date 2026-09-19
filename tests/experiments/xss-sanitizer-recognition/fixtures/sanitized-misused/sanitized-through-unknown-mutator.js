// Case 25 — sanitized output is then passed through an unknown function
// that could reintroduce unsafe markup. Neither implementation should
// credit this as sanitized: the sink's effective node is a call to
// `someMutator(...)`, not a DOMPurify call.
import DOMPurify from "dompurify";

function someMutator(html) {
    return html.replace(/&lt;/g, "<"); // could reintroduce stripped tags
}

function render(el, userInput) {
    const clean = DOMPurify.sanitize(userInput);
    const mutated = someMutator(clean);
    el.innerHTML = mutated;
}
