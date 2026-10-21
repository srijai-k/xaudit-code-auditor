app.post("/admin/promote", authenticated, (req, res) => {
  const user = users.find((u) => u.id === Number(req.body.userId));
  user.role = "admin";
  res.json({ promoted: true });
});
