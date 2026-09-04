function search(term) {
  return knex.raw("SELECT * FROM items WHERE name = '" + term + "'");
}
