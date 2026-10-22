app.get("/internal/config", (req, res) => {
  res.json({ jwtSecret: JWT_SECRET, apiToken: process.env.INTERNAL_API_TOKEN });
});

app.get("/account/:id", authenticated, (req, res) => {
  const a = findAccount(req.params.id, req.auth.userId);
  res.json({ id: a.id, email: a.email, password: a.password });
});
