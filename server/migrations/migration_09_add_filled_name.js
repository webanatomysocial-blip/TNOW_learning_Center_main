exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.string("filled_name").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("filled_name");
  });
};
