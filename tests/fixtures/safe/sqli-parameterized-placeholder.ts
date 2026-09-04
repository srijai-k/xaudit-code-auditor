function getUser(id) {
  const query = "SELECT * FROM users WHERE id = $1";
  return db.query(query, [id]);
}
