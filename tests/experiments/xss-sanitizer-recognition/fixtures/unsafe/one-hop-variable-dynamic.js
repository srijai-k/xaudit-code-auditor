// Case 09 — dynamic HTML reaching the sink through exactly one direct local assignment.
function render(el, userInput) {
    const html = userInput;
    el.innerHTML = html;
}
