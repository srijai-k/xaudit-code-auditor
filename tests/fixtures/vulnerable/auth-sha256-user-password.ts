function hashPassword(user) {
  return crypto.createHash("sha256").update(user.password).digest("hex");
}
