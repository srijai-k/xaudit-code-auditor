app.post("/webhooks/register", async (req, res) => {
  await fetch(req.body.callbackUrl, { method: "POST", body: "ping" });
  res.sendStatus(204);
});
