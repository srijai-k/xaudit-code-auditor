// Case 02 — dynamic innerHTML built via a template literal with interpolation.
function renderGreeting(el, userName) {
    el.innerHTML = `<h1>Welcome, ${userName}</h1>`;
}
