app.get("/download", (req, res) => {
  res.sendFile(path.join(uploadsDir, path.basename(req.query.file)));
});
