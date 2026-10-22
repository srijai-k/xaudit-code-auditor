app.post("/echo", (req, res) => {
  res.send(req.body);
});
