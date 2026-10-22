app.post("/users", async (req, res) => {
  const user = await createUser(req.body);
  res.redirect("/users/" + req.params.id);
});
