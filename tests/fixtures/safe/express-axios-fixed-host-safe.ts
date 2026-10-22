app.get("/weather", async (req, res) => {
  const r = await axios.get("https://api.weather.example/v1/today/" + encodeURIComponent(req.query.city));
  res.json(r.data);
});
