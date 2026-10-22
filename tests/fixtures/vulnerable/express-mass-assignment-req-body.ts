app.put("/me", authenticated, (req, res) => {
  Object.assign(req.user, req.body);
  res.json({ ok: true });
});

app.post("/users", (req, res) => {
  db.users.insert({ ...req.body, createdAt: Date.now() });
  res.sendStatus(201);
});
