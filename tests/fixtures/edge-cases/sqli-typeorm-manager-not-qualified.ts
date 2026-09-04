function getUser(id) {
  return manager.query("SELECT * FROM users WHERE id = " + id);
}
