function getUser(id) {
  return db.query("SELECT * FROM users WHERE id = " + id);
}
