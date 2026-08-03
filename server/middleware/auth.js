const jwt = require("jsonwebtoken");

const DEV_DEFAULT_SECRET = "dev-only-insecure-secret-change-me";

function getSecret() {
  if (!process.env.JWT_SECRET) {
    console.warn("[auth] JWT_SECRET not set — using an insecure dev-only default. Set JWT_SECRET in production.");
    return DEV_DEFAULT_SECRET;
  }
  return process.env.JWT_SECRET;
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
