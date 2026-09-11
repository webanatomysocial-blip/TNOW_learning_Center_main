const path = require("node:path");
const fs = require("node:fs");

// Ensure .env is loaded whether running from project root (cPanel Passenger) or server/ dir
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const db = require("./db");
const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const emailInvitesRoutes = require("./routes/email-invites");
const cookieConsentRoutes = require("./routes/cookie-consent");
const uploadsRoutes = require("./routes/uploads");
const tidycalRoutes = require("./routes/tidycal");

const app = express();

// Standard security headers (X-Content-Type-Options, no-sniff, HSTS, etc). CSP is
// left off — this process also serves the built SPA (see distDir below) and a
// default CSP would break its inline-free but dynamically-hashed Vite assets
// without deployment-specific tuning.
app.use(helmet({ contentSecurityPolicy: false }));
app.set("trust proxy", 1); // needed for correct req.ip behind cPanel/Passenger's proxy

// Brute-force guards on the endpoints that matter: admin password login and the
// magic-link security-code flow (the code itself is 6 digits — MAX_CODE_ATTEMPTS in
// email-invites.js caps guesses per-invite, but this caps guesses across invites
// from one IP too). A generous ceiling on everything else absorbs scripted abuse
// without affecting normal usage.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/admin/login", authLimiter);
app.use("/api/magic/:code/consume", authLimiter);
app.use("/api/", apiLimiter);

// API responses reflect live database state (e.g. admin toggling a product's
// status) — never let a browser, proxy, or the host's page-cache layer (LiteSpeed's
// cache is common on shared hosting and can cache GET JSON responses by default)
// serve a stale one.
app.use("/api/", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// CORS_ORIGIN may be a comma-separated list (e.g. multiple local dev ports).
// In development, also allow any http://localhost:<port> / http://127.0.0.1:<port>
// origin (Vite silently shifts ports when one is busy), plus any private LAN IP
// origin (192.168.x.x / 10.x.x.x / 172.16-31.x.x) so the app can be opened from
// another device (phone, another laptop) on the same network during testing.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const isDev = (process.env.NODE_ENV || "development") !== "production";
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
const lanPattern =
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):\d+$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // same-origin / curl / server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (isDev && (localhostPattern.test(origin) || lanPattern.test(origin))) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(authRoutes);
app.use(contentRoutes);
app.use(emailInvitesRoutes);
app.use(cookieConsentRoutes);
app.use(uploadsRoutes);
app.use(tidycalRoutes);
// Uploaded images are public content meant to be <img>-embedded from the
// frontend origin — helmet's default same-origin CORP header would otherwise
// block that cross-origin load in local dev (API on :4000, Vite on :5173).
app.use(
  "/uploads",
  (req, res, next) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

// On shared hosting (cPanel's Node.js App feature) there's typically one app per
// domain — so this same process also serves the built React SPA (../dist or ./dist) instead
// of needing a second static host + CORS between them.
const distDir = [
  path.join(__dirname, "..", "dist"),
  path.join(__dirname, "dist"),
  path.join(process.cwd(), "dist"),
].find((dir) => fs.existsSync(dir)) || path.join(__dirname, "..", "dist");

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use("/assets", express.static(path.join(distDir, "assets")));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("[EXPRESS ERROR]", req.method, req.url, err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

const PORT = Number(process.env.PORT) || 4000;

// No SSH/terminal access on shared hosting (cPanel Node.js App) means there's no way
// to run `knex migrate` / `knex seed` by hand — so run them here, on boot, instead.
// migrate.latest() is safe to repeat on every restart (knex tracks what's already
// applied and no-ops).
//
// Seeding is destructive (delete-then-insert) and must only ever run once, on a
// database's very first boot. It is gated on a dedicated `bootstrap_state` table
// (see migrations/migration_16_create_bootstrap_state.js) rather than on any
// business table being empty. That distinction matters:
//
//   Checking "is `products` empty?" conflates two different facts — "has this
//   database ever been seeded" and "does this table currently have zero rows" —
//   which are NOT the same thing. An admin who deliberately clears out demo
//   products before adding their own real ones would find every subsequent
//   restart silently re-running the seed and reintroducing the deleted demo
//   content, quietly overwriting their intentional cleanup. It's also fragile
//   across schema changes: a future migration could legitimately leave a
//   business table transiently empty for reasons that have nothing to do with
//   "is this a fresh install."
//
//   A dedicated bootstrap table tracks *intent* ("the one-time baseline load has
//   happened") completely independent of *current data state*. Once that row
//   exists, seeding never runs again — no matter what an admin does to their
//   content afterwards. It also leaves an audit trail (`seeded_at`) and a clean
//   extension point if a deliberate "re-seed" admin action is ever added later.
//
// Deliberately does NOT catch its own errors — a failed migration or seed must
// abort startup entirely (see the fail-fast block below), not be swallowed here.
// db.migrate.latest() is also what implicitly proves the DB connection itself is
// good: knex doesn't eagerly connect at construction time, so this first real
// query is the actual "database is reachable" check, not just "migrations ran."
async function ensureDatabaseReady() {
  await db.migrate.latest();
  console.log("[startup] Database migrations are up to date.");

  const alreadyBootstrapped = await db("bootstrap_state").first();
  if (!alreadyBootstrapped) {
    console.log("[startup] First install detected — running one-time baseline seed...");
    await db.seed.run();
    await db("bootstrap_state").insert({ seeded_at: new Date() });
    console.log("[startup] Baseline seed complete — database is now bootstrapped.");
  }
}

// Fail-fast startup: app.listen() must never run until every startup dependency
// (env vars loaded, DB reachable, migrations applied, one-time seed done if
// needed) has actually succeeded — so there is no window where the process is
// accepting HTTP traffic in a partially-initialized state. If anything above
// throws, log it and exit non-zero rather than limping along with a broken DB;
// Passenger (or systemd/PM2 on another host) is responsible for restarting the
// process once the underlying issue — usually missing/wrong env vars on a first
// deploy — is fixed and "Restart Application" is clicked again.
(async () => {
  try {
    await ensureDatabaseReady();

    const server = app.listen(PORT, () => {
      console.log(`ToggleNow Experience Center API listening on http://localhost:${PORT}`);
    });

    // EADDRINUSE/EACCES are async failures on the underlying socket, not thrown
    // exceptions — they surface on the server's "error" event, not inside the
    // app.listen() callback and not catchable by the try/catch above. Handling
    // them here is what actually lets us fail fast on a busy/forbidden port
    // instead of crashing later with an unhandled 'error' event and a raw trace.
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        // Deliberately no err/stack dump here — the cause is never in this
        // codebase, it's always "something else already owns this port," so a
        // stack trace pointing at net.js internals would only add noise.
        console.error(`[startup] Port ${PORT} is already in use.`);
        console.error("[startup] Another process is already listening on this port.");
      } else if (err.code === "EACCES") {
        console.error(`[startup] Permission denied to bind to port ${PORT}.`);
        console.error(
          "[startup] This process doesn't have permission to listen on this port " +
            "(common for ports <1024 without elevated privileges). Use a different " +
            "port or grant the required permission.",
        );
      } else {
        console.error("[startup] Unexpected error while starting the HTTP server:");
        console.error(err);
      }
      process.exit(1);
    });
  } catch (err) {
    // Two-line, grep-friendly form: a consistent, unmistakable marker line first,
    // then the full error (with stack) on its own — much easier to spot in a
    // scrolling Passenger/cPanel log than one long inline message.
    console.error("[startup] Fatal error during startup — refusing to serve requests:");
    console.error(err);
    process.exit(1);
  }
})();
