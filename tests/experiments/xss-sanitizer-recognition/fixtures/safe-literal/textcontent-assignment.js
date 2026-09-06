// Case 30 — textContent is not an HTML sink at all; raw user input is safe here.
function render(el, userInput) {
    el.textContent = userInput;
}
