function raw(term) {
  return sql.unsafe("SELECT * FROM logs WHERE msg = '" + term + "'");
}
