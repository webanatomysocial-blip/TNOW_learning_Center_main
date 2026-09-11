exports.up = function (knex) {
  return knex.schema.alterTable("capabilities", (table) => {
    table.string("image_url").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("capabilities", (table) => {
    table.dropColumn("image_url");
  });
};
