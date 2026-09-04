function login(req) {
  if (req.body.password === "admin123") {
    return grantAccess();
  }
  return denyAccess();
}
