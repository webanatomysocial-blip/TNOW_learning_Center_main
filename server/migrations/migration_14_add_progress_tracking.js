exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.integer("progress_percent").notNullable().defaultTo(0);
    // JSON-stringified array of completed step ids, e.g. ["welcome","why"].
    table.text("progress_steps").nullable();
    table.timestamp("progress_updated_at").nullable();
    table.string("product_slug").nullable();
    table.boolean("admin_notified").notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("progress_percent");
    table.dropColumn("progress_steps");
    table.dropColumn("progress_updated_at");
    table.dropColumn("product_slug");
    table.dropColumn("admin_notified");
  });
};
