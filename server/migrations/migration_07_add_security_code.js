exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.string("security_code_hash").nullable();
    table.integer("code_attempts").notNullable().defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("security_code_hash");
    table.dropColumn("code_attempts");
  });
};
