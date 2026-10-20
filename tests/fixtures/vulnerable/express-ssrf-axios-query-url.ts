app.get("/preview", async (req, res) => {
  const response = await axios.get(req.query.url);
  res.json({ title: extractTitle(response.data) });
});
