function render() {
  const safe = "<b>hi</b>";
  const el = document.getElementById('x');
  el.innerHTML = safe;
  return el;
}
