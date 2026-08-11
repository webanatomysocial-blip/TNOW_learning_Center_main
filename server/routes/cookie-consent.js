const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Public: called once per banner accept. Re-accepting after a cleared cookie just
// inserts another row — that's the "times opened" history, no extra tracking needed.
router.post("/api/cookie-consent", async (req, res) => {
  const deviceId = String(req.body?.deviceId || "").trim();
  if (!deviceId) return res.status(400).json({ message: "deviceId is required" });
  try {
    await db("cookie_consents").insert({
      device_id: deviceId,
      email: req.body?.email || null,
      user_agent: req.headers["user-agent"] || null,
      ip: req.ip,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to record consent" });
  }
});

// Admin: one row per device, with the count/last-seen the list page shows. Full
// per-visit timestamps are fetched separately by the device detail page.
router.get("/api/admin/cookie-consents", requireAdmin, async (req, res) => {
  try {
    const rows = await db("cookie_consents")
      .select("device_id")
      .max("consented_at as last_consented_at")
      .min("consented_at as first_consented_at")
      .max("email as email")
      .count("id as times_opened")
      .groupBy("device_id")
      .orderBy("last_consented_at", "desc");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch cookie consents" });
  }
});

router.get("/api/admin/cookie-consents/:deviceId", requireAdmin, async (req, res) => {
  try {
    const rows = await db("cookie_consents")
      .where({ device_id: req.params.deviceId })
      .orderBy("consented_at", "desc");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch consent history" });
  }
});

module.exports = router;
