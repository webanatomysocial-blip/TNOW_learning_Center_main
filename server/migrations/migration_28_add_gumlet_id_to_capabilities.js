// Adds gumlet_id column to capabilities to support playing Gumlet videos
// directly via a dedicated Gumlet video ID.
exports.up = function (knex) {
  return knex.schema.alterTable("capabilities", (table) => {
    table.string("gumlet_id").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("capabilities", (table) => {
    table.dropColumn("gumlet_id");
  });
};
