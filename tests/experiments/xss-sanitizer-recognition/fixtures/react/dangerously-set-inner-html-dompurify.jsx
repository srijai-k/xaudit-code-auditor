// Case 14 — React dangerouslySetInnerHTML wrapped directly in DOMPurify.sanitize().
import DOMPurify from "dompurify";

function Comment({ body }) {
    return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }} />;
}
