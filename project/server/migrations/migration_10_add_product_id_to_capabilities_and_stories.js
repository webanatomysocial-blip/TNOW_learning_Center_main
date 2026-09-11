exports.up = async function (knex) {
  await knex.schema.alterTable("capabilities", (table) => {
    table.integer("product_id").unsigned().references("id").inTable("products").nullable();
  });
  await knex.schema.alterTable("stories", (table) => {
    table.integer("product_id").unsigned().references("id").inTable("products").nullable();
  });

  const secops = await knex("products").where({ slug: "secops" }).first();
  if (secops) {
    await knex("capabilities").whereNull("product_id").update({ product_id: secops.id });
    await knex("stories").whereNull("product_id").update({ product_id: secops.id });
  }
};

exports.down = async function (knex) {
  await knex.schema.alterTable("capabilities", (table) => {
    table.dropColumn("product_id");
  });
  await knex.schema.alterTable("stories", (table) => {
    table.dropColumn("product_id");
  });
};
