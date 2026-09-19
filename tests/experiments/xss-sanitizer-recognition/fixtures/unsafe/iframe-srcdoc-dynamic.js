// Case 07 — iframe.srcdoc with dynamic content (rendered as a full document, scripts and all).
function previewHtml(iframeEl, rawUserHtml) {
    iframeEl.srcdoc = rawUserHtml;
}
