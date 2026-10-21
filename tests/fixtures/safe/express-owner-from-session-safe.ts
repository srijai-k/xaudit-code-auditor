app.post("/notes", authenticated, (req, res) => {
  notes.push({ ownerId: req.user.id, text: req.body.text });
  res.sendStatus(201);
});
user.role = "member";
