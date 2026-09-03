function checkLogin(user, hashedInput) {
  return user.password === hashedInput;
}
