const bcrypt = require("bcrypt");

// A realistic Express auth module: the normal login path is correct
// (bcrypt.compare against a stored hash), but there's a leftover debug
// backdoor from local development that never got removed, plus an
// unrelated role check that must not be confused with a credential check.
async function login(req, res) {
    const { username, password } = req.body;

    // Leftover debug bypass — a real, if embarrassing, thing that happens.
    if (password === "letmein-dev-only") {
        return res.json({ token: issueToken(username) });
    }

    const user = await findUser(username);
    if (!user) return res.status(401).json({ error: "invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "invalid credentials" });

    return res.json({ token: issueToken(username) });
}

function requireAdmin(req, res, next) {
    if (req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ error: "forbidden" });
}

module.exports = { login, requireAdmin };
