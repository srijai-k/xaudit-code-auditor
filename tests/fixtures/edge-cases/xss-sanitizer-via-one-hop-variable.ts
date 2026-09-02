import DOMPurify from 'dompurify';
function render(userInput) {
  const clean = DOMPurify.sanitize(userInput);
  const el = document.getElementById('out');
  el.innerHTML = clean;
  return el;
}
