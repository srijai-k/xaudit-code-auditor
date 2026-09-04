function del(token) {
  return connection.query("DELETE FROM sessions WHERE token = '" + token + "'");
}
