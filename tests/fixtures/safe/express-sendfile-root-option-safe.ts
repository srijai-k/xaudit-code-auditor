app.get("/files/:name", (req, res) => {
  res.sendFile(req.params.name, { root: uploadsDir });
});
