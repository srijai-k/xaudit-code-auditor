function getUser(id) {
  return dataSource.query(`SELECT * FROM users WHERE id = ${id}`);
}
