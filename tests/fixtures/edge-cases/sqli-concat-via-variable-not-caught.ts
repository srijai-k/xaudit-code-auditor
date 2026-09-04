function getUser(id) {
  const query = "SELECT * FROM users WHERE id = " + id;
  return db.query(query);
}
