const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { requireAdmin, getSecret } = require("../middleware/auth");

const router = express.Router();

router.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  try {
    const admin = await db("admins").where({ email }).first();
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ sub: admin.id, email: admin.email }, getSecret(), {
      expiresIn: "7d",
    });

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/api/admin/me", requireAdmin, async (req, res) => {
  try {
    const admin = await db("admins").where({ id: req.admin.sub }).first();
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    return res.json({ id: admin.id, email: admin.email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch admin" });
  }
});

module.exports = router;
