app.post("/login", async (req, res) => {
  const token = await createSession(req.body.email);
  res.cookie("session", token, { secure: true });
  res.redirect("/dashboard");
});
