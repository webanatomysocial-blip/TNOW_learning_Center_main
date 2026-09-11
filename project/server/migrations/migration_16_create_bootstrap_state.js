// Tracks whether the one-time baseline seed has ever been run against this
// database — deliberately a dedicated table, not a derived fact about any
// business table's row count. See server/index.js's ensureDatabaseReady() for why.
exports.up = function (knex) {
  return knex.schema.createTable("bootstrap_state", (table) => {
    table.increments("id").primary();
    table.timestamp("seeded_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("bootstrap_state");
};
