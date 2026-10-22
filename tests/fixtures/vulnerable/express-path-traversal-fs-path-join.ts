app.get("/download", (req, res) => {
  fs.readFile(path.join(uploadsDir, req.query.file), (err, data) => {
    if (err) return res.status(404).end();
    res.send(data);
  });
});
