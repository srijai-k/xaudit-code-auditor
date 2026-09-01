function search(email) {
  return client.query(`SELECT * FROM users WHERE email = '${email}'`);
}
