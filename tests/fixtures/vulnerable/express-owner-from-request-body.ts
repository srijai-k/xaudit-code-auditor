app.post("/documents", authenticated, (req, res) => {
  documents.push({ ownerId: req.body.ownerId || req.auth.userId, content: req.body.content });
  res.sendStatus(201);
});

app.post("/signup", (req, res) => {
  createUser({ email: req.body.email, role: req.body.role });
  res.sendStatus(201);
});
