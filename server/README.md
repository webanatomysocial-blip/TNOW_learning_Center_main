# ToggleNow CMS API

Express + Knex API backing the admin CMS (products, capabilities, customer stories) and admin JWT auth.
Knex lets the exact same code run against SQLite (local dev) or MySQL (production) — only the
`NODE_ENV` / connection env vars change.

## Local development

```bash
cd server
npm install
cp .env.example .env   # optional — defaults work out of the box for dev
npm run migrate         # creates server/dev.sqlite3 with the schema
npm run seed            # seeds products/capabilities/stories + one admin user
npm run dev             # starts on http://localhost:4000 (nodemon, auto-restart)
```

Default seeded admin (only if `ADMIN_EMAIL`/`ADMIN_PASSWORD` are not set):
`admin@togglenow.com` / `changeme123` — **change this in any shared/production environment.**

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
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and the production DB vars.
