app.delete("/admin/users/:id", authenticated, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

app.post("/admin/flags", authenticated, (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  setFlag(req.body.name, req.body.value);
  res.json({ ok: true });
});

app.use("/admin", authenticated, requireRole("admin"));
app.post("/admin/promote", (req, res) => {
  promote(req.body.userId);
  res.json({ ok: true });
});
