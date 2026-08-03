const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  const email = process.env.ADMIN_EMAIL || "admin@togglenow.com";
  const password = process.env.ADMIN_PASSWORD || "changeme123";

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      `[seed] ADMIN_EMAIL/ADMIN_PASSWORD not set — using default admin credentials (${email} / ${password}). Change this immediately in production.`,
    );
  }

  await knex("admins").where({ email }).del();

  const password_hash = await bcrypt.hash(password, 10);
  await knex("admins").insert({ email, password_hash });
};
