// A realistic config module: mostly proper env-var usage, but with one
// hardcoded fallback left in from local development that never got removed
// before this was committed — a very common real-world leak pattern.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_live_51MfYs9L0yR2eR0f7vR0f7vR0f7vR0f7v";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost:5432/dev";
const PORT = process.env.PORT || 3000;
const FEATURE_FLAGS = {
    newCheckout: process.env.FEATURE_NEW_CHECKOUT === "true",
    betaDashboard: false,
};

module.exports = { STRIPE_SECRET_KEY, DATABASE_URL, PORT, FEATURE_FLAGS };
