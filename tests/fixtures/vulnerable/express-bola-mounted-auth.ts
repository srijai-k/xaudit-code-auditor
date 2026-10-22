app.use("/api", requireAuth);
app.get("/api/invoices/:id", async (req, res) => {
  res.json(await Invoice.findById(req.params.id));
});
