exports.up = function (knex) {
  return knex.schema.createTable("admins", (table) => {
    table.increments("id").primary();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("admins");
};
