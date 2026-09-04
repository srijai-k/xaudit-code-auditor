function search(name) {
  return db.query("SELECT * FROM users WHERE name = '" + escapeSql(name) + "'");
}
