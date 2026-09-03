function del(token) {
  return queryRunner.query("DELETE FROM sessions WHERE token = '" + token + "'");
}
