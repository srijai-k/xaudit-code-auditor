app.get("/documents/:id", authenticated, (req, res) => {
  const doc = documents.find((d) => d.id === Number(req.params.id));
  if (!doc || doc.ownerId !== req.auth.userId) return res.status(404).end();
  res.json(doc);
});

app.get("/orders/:id", requireLogin, async (req, res) => {
  res.json(await Order.findOne({ _id: req.params.id, user: req.user.id }));
});
