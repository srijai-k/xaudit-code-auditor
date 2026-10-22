app.get("/greet", (req, res) => {
  const { name } = req.query;
  res.status(200).send(`<p>Welcome back, ${name}!</p>`);
});
