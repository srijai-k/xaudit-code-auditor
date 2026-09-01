function build(body) {
  const fn = Function('x', body);
  return fn(5);
}
