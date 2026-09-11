exports.up = function (knex) {
  return knex.schema.createTable("stories", (table) => {
    table.increments("id").primary();
    table.string("slug").notNullable().unique();
    table.string("industry");
    table.string("company");
    table.string("metric");
    table.text("challenge");
    table.text("solution");
    table.text("results");
    table.integer("sort_order").defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("stories");
};
