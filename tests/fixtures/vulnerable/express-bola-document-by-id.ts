app.get("/documents/:id", authenticated, (req, res) => {
  const doc = documents.find((d) => d.id === Number(req.params.id));
  if (!doc) return res.status(404).end();
  res.json(doc);
});
