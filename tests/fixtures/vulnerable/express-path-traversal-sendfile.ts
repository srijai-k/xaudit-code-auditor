app.get("/files/:name", (req, res) => {
  res.sendFile(__dirname + "/uploads/" + req.params.name);
});
