async function byId(id) {
  return pool.execute(`SELECT * FROM orders WHERE id = ${id}`);
}
