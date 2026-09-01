function build(body) {
  const fn = new Function('x', body);
  return fn(5);
}
