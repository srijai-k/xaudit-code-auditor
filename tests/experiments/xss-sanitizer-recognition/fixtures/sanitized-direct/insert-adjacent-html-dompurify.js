// Case 13 — insertAdjacentHTML wrapped directly in DOMPurify.sanitize().
import DOMPurify from "dompurify";

function appendComment(el, commentBody) {
    el.insertAdjacentHTML("beforeend", DOMPurify.sanitize(commentBody));
}
