const path = require("node:path");
const fs = require("node:fs");

// dotenv defaults to loading ".env" from process.cwd(), which on a cPanel/Passenger
// deployment is the Application Root (the project root, not this server/ folder) —
// so the default would silently miss server/.env. Point it here explicitly.
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const db = require("./db");
const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const emailInvitesRoutes = require("./routes/email-invites");

const app = express();

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

// On shared hosting (cPanel's Node.js App feature) there's typically one app per
// domain — so this same process also serves the built React SPA (../dist) instead
// of needing a second static host + CORS between them. Local dev doesn't build to
// dist/, so this is a no-op there (Vite's own dev server handles the frontend).
const distDir = path.join(__dirname, "..", "dist");

// ===== TEMPORARY RUNTIME DEBUG — remove once /assets/* 404 is root-caused =====
console.log("========== STARTUP DEBUG ==========");
console.log("__dirname:", __dirname);
console.log("process.cwd():", process.cwd());
console.log("distDir:", distDir);
console.log("dist exists:", fs.existsSync(distDir));
console.log("assets exists:", fs.existsSync(path.join(distDir, "assets")));
console.log("index exists:", fs.existsSync(path.join(distDir, "index.html")));
console.log("==================================");

app.use((req, res, next) => {
  console.log("[REQUEST]", req.method, req.url);
  next();
});
// ===== END TEMPORARY STARTUP DEBUG (request logger stays active below) =====

if (fs.existsSync(distDir)) {
  // TEMPORARY: fallthrough:false makes express.static hand any file it can't find
  // to the [STATIC ERROR] handler below (a real Error) instead of silently calling
  // next() and letting the SPA catch-all mask it with a 200 index.html response —
  // that silent fallthrough is what normally hides a wrong/missing file from you.
  app.use(express.static(distDir, { fallthrough: false }));

  // ===== TEMPORARY — surfaces exactly what express.static failed to find =====
  app.use((err, req, res, next) => {
    console.error("[STATIC ERROR]", err);
    next(err);
  });
  // ===== END TEMPORARY =====

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

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
