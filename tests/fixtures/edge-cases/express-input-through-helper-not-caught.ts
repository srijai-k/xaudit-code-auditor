function buildGreeting(name) {
  return "<h1>Hello " + name + "</h1>";
}

app.get("/hello", (req, res) => {
  res.send(buildGreeting(req.query.name));
});
