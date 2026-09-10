// Case 32 — parameterized DOM updates (className/dataset) — never an HTML sink.
function highlightRow(el, userSuppliedClassName) {
    el.className = userSuppliedClassName;
    el.dataset.userId = userSuppliedClassName;
}
