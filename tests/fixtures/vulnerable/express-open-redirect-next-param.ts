app.post("/login", async (req, res) => {
  await signIn(req.body.email, req.body.password);
  res.redirect(req.query.next);
});
