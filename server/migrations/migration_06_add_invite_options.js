exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.boolean("device_lock").notNullable().defaultTo(true);
    table.integer("duration_hours").notNullable().defaultTo(24);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("device_lock");
    table.dropColumn("duration_hours");
  });
};
