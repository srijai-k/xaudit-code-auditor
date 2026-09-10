// Case 12 — outerHTML wrapped directly in DOMPurify.sanitize() at the sink.
import DOMPurify from "dompurify";

function replaceWidget(el, userSuppliedMarkup) {
    el.outerHTML = DOMPurify.sanitize(userSuppliedMarkup);
}
