// Case 27 — a template literal with zero interpolations is statically safe.
function renderStaticBanner(el) {
    el.innerHTML = `<strong>Maintenance scheduled for Sunday.</strong>`;
}
