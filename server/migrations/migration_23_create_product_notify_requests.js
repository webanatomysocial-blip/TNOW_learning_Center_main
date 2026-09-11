// Tracks who asked to be notified about a "coming soon" product (the Notify Me
// button on the product-selection teaser) so that when an admin later flips
// that product to "available", everyone on the list can be emailed
// automatically instead of the request being a one-way, forgotten lead email.
exports.up = function (knex) {
  return knex.schema.createTable("product_notify_requests", (table) => {
    table.increments("id").primary();
    table.string("product_slug").notNullable();
    table.string("email").notNullable();
    table.string("name").nullable();
    table.timestamp("requested_at").defaultTo(knex.fn.now());
    table.timestamp("notified_at").nullable();
    table.unique(["product_slug", "email"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("product_notify_requests");
};
