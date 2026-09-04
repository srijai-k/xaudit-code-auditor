function render() {
  const original = "<b>hi</b>";
  const safe = original;
  const el = document.getElementById('x');
  el.innerHTML = safe;
  return el;
}
