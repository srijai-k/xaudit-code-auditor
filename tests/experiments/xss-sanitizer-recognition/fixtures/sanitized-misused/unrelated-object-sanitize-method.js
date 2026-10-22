// Case 22 — a `.sanitize(...)` method on an object with nothing to do with
// DOMPurify. Baseline's SANITIZER_CALLEE_NAMES.has(propName) check matches
// this by property name alone, regardless of receiver. The narrow
// experimental rule must not.
const someObject = {
    sanitize(x) {
        return x.toUpperCase(); // does not remove any HTML at all
    },
};

function render(el, userInput) {
    const result = someObject.sanitize(userInput);
    el.innerHTML = result;
}
