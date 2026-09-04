async function loadChart() {
  const mod = await import('./chart.js');
  return mod.default;
}
