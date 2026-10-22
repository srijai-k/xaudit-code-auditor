// Case 06 — React dangerouslySetInnerHTML with a raw, unsanitized prop.
function Comment({ body }) {
    return <div dangerouslySetInnerHTML={{ __html: body }} />;
}
