const jwt = require("jsonwebtoken");

// A realistic session module. The actual authentication middleware
// correctly verifies the signature. A separate, later-added helper for
// displaying "welcome back, {name}" on the client was written by copying
// the decode call without realizing verify() had already happened
// upstream — but from this file's own perspective in isolation, that
// distinction isn't visible, which is exactly this rule's disclosed
// whole-file limitation.
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: "invalid token" });
    }
}

function getDisplayName(token) {
    const claims = jwt.decode(token);
    return claims?.name ?? "Guest";
}

module.exports = { authenticate, getDisplayName };
