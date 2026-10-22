app.post("/login", (req, res) => {
  res.json({ token: makeSession(), user: { id: u.id, email: u.email } });
});
res.json({ accessToken, refreshToken, expiresIn: 3600 });
res.json({ passwordChanged: true });
