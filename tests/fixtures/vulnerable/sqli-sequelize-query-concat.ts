function getUser(id) {
  return sequelize.query("SELECT * FROM users WHERE id = " + id);
}
