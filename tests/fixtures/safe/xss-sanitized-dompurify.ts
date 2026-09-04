import DOMPurify from 'dompurify';
function render(userInput) {
  const el = document.getElementById('out');
  el.innerHTML = DOMPurify.sanitize(userInput);
  return el;
}
