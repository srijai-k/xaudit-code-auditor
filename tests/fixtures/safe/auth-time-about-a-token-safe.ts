const tokenExpiresAt = Date.now() + 3600 * 1000;
const token = crypto.randomBytes(16).toString("hex") + "-" + Date.now();
