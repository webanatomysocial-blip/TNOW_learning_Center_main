# ToggleNow Experience Center API

Express + Knex API backing the ToggleNow Experience Center admin panel (products, capabilities,
customer stories) and admin JWT auth.
Knex lets the exact same code run against SQLite (local dev) or MySQL (production) — only the
`NODE_ENV` / connection env vars change.

## Local development

```bash
cd server
npm install
cp .env.example .env   # optional — defaults work out of the box for dev
npm run migrate         # creates server/dev.sqlite3 with the schema
npm run seed            # creates the first admin account only (no demo content)
npm run dev             # starts on http://localhost:4000 (nodemon, auto-restart)
```

Admin accounts are **not** seeded. There is no signup route, so the first admin row has to
be created directly in the `admins` table (email + bcrypt password hash). Example:

```bash
node -e "
const bcrypt = require('bcryptjs');
const knex = require('knex')(require('./knexfile').development); // or .production
(async () => {
  const hash = await bcrypt.hash('your-password-here', 10);
  await knex('admins').insert({ email: 'you@example.com', password_hash: hash });
  await knex.destroy();
})();
"
```

To change an existing admin's password later, update `password_hash` the same way
(`knex('admins').where({ email }).update({ password_hash: hash })`) instead of re-seeding.

## Production

Set `NODE_ENV=production` plus either `DATABASE_URL` or the discrete `DB_HOST` / `DB_PORT` /
`DB_USER` / `DB_PASSWORD` / `DB_NAME` vars pointing at a MySQL database. Then run the exact same
commands:

```bash
NODE_ENV=production npm run migrate
NODE_ENV=production npm run seed
NODE_ENV=production npm start
```

No code changes are needed between environments — `knexfile.js` selects the driver
(`sqlite3` vs `mysql2`) based on `NODE_ENV`.

## Environment variables

See `.env.example` for the full list: `NODE_ENV`, `PORT`, `JWT_SECRET`, `CORS_ORIGIN`,
`ADMIN_EMAIL` (invite-notification fallback address only), and the production DB vars.
