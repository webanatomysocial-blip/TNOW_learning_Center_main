exports.up = function (knex) {
  return knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("slug").notNullable().unique();
    table.string("name").notNullable();
    table.string("tagline");
    table.text("description");
    table.text("capabilities_tags"); // JSON-stringified array
    table.string("time");
    table.string("status");
    table.string("cta");
    table.integer("sort_order").defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("products");
};
