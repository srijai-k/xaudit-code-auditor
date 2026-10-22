app.get("/products/:id", async (req, res) => {
  res.json(await Product.findById(req.params.id));
});
