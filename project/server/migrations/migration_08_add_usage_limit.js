exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.boolean("single_use").notNullable().defaultTo(true);
    table.integer("use_count").notNullable().defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("single_use");
    table.dropColumn("use_count");
  });
};
