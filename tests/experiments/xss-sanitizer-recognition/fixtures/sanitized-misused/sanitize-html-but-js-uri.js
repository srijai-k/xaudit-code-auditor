// Case 20 — HTML is sanitized correctly, but a separate javascript: URI is
// still built dynamically elsewhere in the same file. Sanitizing the HTML
// sink must never suppress or downgrade the unrelated URI-sink finding.
import DOMPurify from "dompurify";

function renderComment(el, comment) {
    el.innerHTML = DOMPurify.sanitize(comment.body);
}

function renderCustomAction(actionPayload) {
    location.href = "javascript:" + actionPayload;
}
