// A small legacy microservice that trusts an upstream gateway to have
// already validated tokens, and just reads claims out of them for
// logging and routing — except this file never actually verifies
// anything itself, and there's no way to know from here whether the
// upstream gateway really does. A realistic, disclosed limitation of
// this rule: it can't see across services/files, only within one file.
const jwt = require("jsonwebtoken");

function routeByTenant(req, res, next) {
    const token = req.headers["x-forwarded-token"];
    const claims = jwt.decode(token);
    req.tenantId = claims?.tenantId;
    next();
}

module.exports = { routeByTenant };
