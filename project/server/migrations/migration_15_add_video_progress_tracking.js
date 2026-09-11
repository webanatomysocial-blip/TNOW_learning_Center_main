exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.integer("videos_watched").notNullable().defaultTo(0);
    table.integer("videos_total").notNullable().defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("videos_watched");
    table.dropColumn("videos_total");
  });
};
