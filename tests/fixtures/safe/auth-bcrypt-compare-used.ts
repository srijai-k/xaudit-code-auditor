async function login(password, storedHash) {
  return bcrypt.compare(password, storedHash);
}
