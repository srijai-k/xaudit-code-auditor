// Case 01 — classic DOM XSS: location.hash flows directly into innerHTML.
function renderFromHash(el) {
    el.innerHTML = location.hash.slice(1);
}
