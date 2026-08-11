// Lets a customer whose device-locked link now rejects them (cleared cookies/localStorage,
// new browser, etc.) ask the admin to unlock it, instead of just hitting a dead end.
exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.timestamp("access_requested_at").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("access_requested_at");
  });
};
