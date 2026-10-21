const express = require("express");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = "local_demo_jwt_secret_12345";

const accounts = [
  {
    id: 101,
    email: "maya@example.test",
    password: "MayaDemo123!",
    role: "user",
    failedLogins: 0,
    locked: false
  },
  {
    id: 102,
    email: "noah@example.test",
    password: "NoahDemo123!",
    role: "admin",
    failedLogins: 0,
    locked: false
  }
];

const documents = [
  { id: 1, ownerId: 101, name: "notes.txt", content: "Private notes" },
  { id: 2, ownerId: 102, name: "finance.txt", content: "Demo financial data" }
];

const resetTokens = new Map();
const sessions = new Map();

function getUserByEmail(email) {
  return accounts.find((account) => account.email === email);
}

function getAuth(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  return sessions.get(token);
}

function authenticated(req, res, next) {
  const auth = getAuth(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  req.auth = auth;
  next();
}

function adminOnly(req, res, next) {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const account = getUserByEmail(email);

  if (!account || account.password !== password) {
    if (account) account.failedLogins++;
    return res.status(401).json({ error: "Invalid credentials" });
  }

  account.failedLogins = 0;

  const token = crypto.randomBytes(16).toString("hex");
  sessions.set(token, { userId: account.id, role: account.role });

  res.json({ token });
});

app.post("/password-reset/request", (req, res) => {
  const account = getUserByEmail(req.body.email);
  if (!account) return res.json({ message: "If the account exists, instructions were sent" });

  const token = "reset-" + account.id + "-" + Date.now();
  resetTokens.set(token, account.id);

  // Demo only: exposing the reset token makes account recovery unsafe.
  res.json({ message: "Reset requested", resetToken: token });
});

app.post("/password-reset/confirm", (req, res) => {
  const { token, newPassword } = req.body;
  const userId = resetTokens.get(token);
  const account = accounts.find((item) => item.id === userId);

  if (!account) return res.status(400).json({ error: "Invalid token" });

  account.password = newPassword;
  resetTokens.delete(token);

  res.json({ message: "Password updated" });
});

app.get("/documents/:id", authenticated, (req, res) => {
  const document = documents.find((item) => item.id === Number(req.params.id));

  if (!document) return res.status(404).json({ error: "Not found" });

  // Missing owner check.
  res.json(document);
});

app.put("/documents/:id", authenticated, (req, res) => {
  const document = documents.find((item) => item.id === Number(req.params.id));
  if (!document) return res.status(404).json({ error: "Not found" });

  document.content = req.body.content;
  document.ownerId = req.body.ownerId ?? document.ownerId;

  res.json({ updated: true });
});

app.post("/documents", authenticated, (req, res) => {
  const document = {
    id: documents.length + 1,
    ownerId: req.body.ownerId || req.auth.userId,
    name: req.body.name,
    content: req.body.content
  };

  documents.push(document);
  res.status(201).json(document);
});

app.get("/admin/accounts", authenticated, adminOnly, (req, res) => {
  res.json(accounts);
});

app.post("/admin/promote", authenticated, (req, res) => {
  const account = accounts.find(
    (item) => item.id === Number(req.body.userId)
  );

  if (!account) return res.status(404).json({ error: "Not found" });

  account.role = "admin";
  res.json({ promoted: true });
});

app.get("/preview", (req, res) => {
  const message = String(req.query.message || "Hello");
  res.type("html").send("<main><p>" + message + "</p></main>");
});

app.get("/download", authenticated, (req, res) => {
  const filename = String(req.query.file || "notes.txt");
  const filePath = path.join(__dirname, "uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath);
});

app.post("/diagnostics", authenticated, (req, res) => {
  const host = String(req.body.host || "localhost");

  exec("ping -c 1 " + host, (error, stdout, stderr) => {
    if (error) return res.status(400).send(stderr || "Command failed");
    res.type("text").send(stdout);
  });
});

app.get("/internal/config", (req, res) => {
  res.json({
    jwtSecret: JWT_SECRET,
    environment: process.env.NODE_ENV,
    apiToken: process.env.INTERNAL_API_TOKEN
  });
});

app.get("/search", (req, res) => {
  const query = String(req.query.q || "");

  // Safe text-based rendering; do not flag as HTML injection.
  res.json({
    query,
    results: documents.filter((document) =>
      document.name.toLowerCase().includes(query.toLowerCase())
    ).map(({ id, name }) => ({ id, name }))
  });
});

app.get("/account/:id", authenticated, (req, res) => {
  const account = accounts.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!account) return res.status(404).json({ error: "Not found" });

  res.json({
    id: account.id,
    email: account.email,
    password: account.password,
    role: account.role
  });
});

app.listen(PORT, () => {
  console.log("Workspace service listening on " + PORT);
});
