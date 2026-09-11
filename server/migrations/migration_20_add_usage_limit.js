// Adds a "custom number of times" option alongside the existing single-use /
// unlimited-until-expiry choice. Null means unlimited (unchanged multi-use
// behavior); a number caps how many times the link can be opened.
exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.integer("usage_limit").unsigned().nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("usage_limit");
  });
};
