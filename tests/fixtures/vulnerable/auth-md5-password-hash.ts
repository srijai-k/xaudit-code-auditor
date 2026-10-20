async function signup(email, password) {
  const hash = crypto.createHash("md5").update(password).digest("hex");
  await db.users.insert({ email, passwordHash: hash });
}
