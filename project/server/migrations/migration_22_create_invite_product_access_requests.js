// Tracks a customer asking for access to a product that's available but not in
// their invite's allowed_product_slugs — separate from the device-lock
// "request-access" flow (email-invites.js), which is about the same product on a
// new device, not a different product entirely.
exports.up = function (knex) {
  return knex.schema.createTable("invite_product_access_requests", (table) => {
    table.increments("id").primary();
    table
      .integer("invite_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("email_invites")
      .onDelete("CASCADE");
    table.string("product_slug").notNullable();
    table.string("status").notNullable().defaultTo("pending"); // pending | approved
    table.timestamp("requested_at").defaultTo(knex.fn.now());
    table.timestamp("resolved_at").nullable();
    table.unique(["invite_id", "product_slug"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("invite_product_access_requests");
};
