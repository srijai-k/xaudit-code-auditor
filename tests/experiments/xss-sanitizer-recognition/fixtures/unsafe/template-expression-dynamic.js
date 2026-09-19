// Case 10 — dynamic HTML through a template expression assigned one hop back.
function render(el, comment) {
    const markup = `<div class="comment">${comment.body}</div>`;
    el.innerHTML = markup;
}
