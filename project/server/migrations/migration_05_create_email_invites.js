exports.up = function (knex) {
  return knex.schema.createTable("email_invites", (table) => {
    table.increments("id").primary();
    table.string("email").notNullable();
    table.string("token_hash").notNullable().unique();
    table.string("status").notNullable().defaultTo("pending");
    table.string("device_fingerprint").nullable();
    table.timestamp("sent_at").nullable();
    table.timestamp("used_at").nullable();
    table.timestamp("expires_at").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("email_invites");
};
