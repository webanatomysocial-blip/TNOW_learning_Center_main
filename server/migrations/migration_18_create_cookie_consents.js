// One row per time a visitor accepts the cookie banner. Consent is stored client-side
// as a real browser cookie (not localStorage) so that clearing cookies naturally makes
// the banner reappear — each re-accept just inserts another row, which is how "times
// opened" / re-consent history is derived, no separate clear-detection logic needed.
exports.up = function (knex) {
  return knex.schema.createTable("cookie_consents", (table) => {
    table.increments("id").primary();
    table.string("device_id").notNullable();
    table.string("email").nullable();
    table.string("user_agent").nullable();
    table.string("ip").nullable();
    table.timestamp("consented_at").defaultTo(knex.fn.now());
    table.index("device_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("cookie_consents");
};
