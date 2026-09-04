function getUser(id) {
  const raw = "SELECT * FROM users WHERE id = " + id;
  const query = raw;
  return db.query(query);
}
