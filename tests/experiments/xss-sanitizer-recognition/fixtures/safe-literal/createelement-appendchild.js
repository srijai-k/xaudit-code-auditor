// Case 31 — createElement + appendChild, never touches an HTML-sink API.
function render(el, userInput) {
    const p = document.createElement("p");
    p.textContent = userInput;
    el.appendChild(p);
}
