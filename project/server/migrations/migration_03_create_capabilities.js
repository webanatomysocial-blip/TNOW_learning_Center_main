exports.up = function (knex) {
  return knex.schema.createTable("capabilities", (table) => {
    table.increments("id").primary();
    table.string("slug").notNullable().unique();
    table.string("title").notNullable();
    table.string("duration");
    table.text("summary");
    table.text("features"); // JSON-stringified array
    table.text("value");
    table.string("video_url").nullable();
    table.integer("sort_order").defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("capabilities");
};
