// Case 26 — a plain string literal assigned to innerHTML. No dynamic value at all.
function renderStaticBanner(el) {
    el.innerHTML = "<strong>Maintenance scheduled for Sunday.</strong>";
}
