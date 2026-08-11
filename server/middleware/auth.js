const jwt = require("jsonwebtoken");

const DEV_DEFAULT_SECRET = "dev-only-insecure-secret-change-me";

function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  // A missing secret in production would silently sign admin tokens with a value
  // that's public in this repo's source — anyone could forge a valid admin JWT.
  // Refuse to start rather than risk that; only dev gets the insecure fallback.
  if ((process.env.NODE_ENV || "development") === "production") {
    throw new Error("JWT_SECRET must be set in production — refusing to sign with an insecure default.");
  }
  console.warn("[auth] JWT_SECRET not set — using an insecure dev-only default. Set JWT_SECRET in production.");
  return DEV_DEFAULT_SECRET;
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, getSecret());
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { requireAdmin, getSecret };
