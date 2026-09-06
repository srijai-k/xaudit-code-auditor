// Case 33 — a real DOMPurify.sanitize() call exists, but its result is never
// used at any HTML sink at all (just logged). Must produce zero findings —
// there is no free-floating "found a sanitizer call" finding in this design.
import DOMPurify from "dompurify";

function auditLog(userInput) {
    const clean = DOMPurify.sanitize(userInput);
    console.log("sanitized value for audit trail:", clean);
}
