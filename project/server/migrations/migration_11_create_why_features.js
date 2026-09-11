exports.up = async function (knex) {
  await knex.schema.createTable("why_features", (table) => {
    table.increments("id").primary();
    table.integer("product_id").unsigned().notNullable().references("id").inTable("products");
    table.string("icon").notNullable();
    table.string("title").notNullable();
    table.text("description");
    table.integer("sort_order").defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  const secops = await knex("products").where({ slug: "secops" }).first();
  if (secops) {
    const FEATURES = [
      { icon: "Timer", title: "Faster Provisioning", description: "Automate access requests in minutes." },
      { icon: "ShieldCheck", title: "Real-Time SoD", description: "Detect conflicts before approvals." },
      { icon: "CreditCard", title: "License Optimization", description: "Reduce SAP licensing costs." },
      { icon: "Users", title: "Unified Governance", description: "Manage users and compliance centrally." },
    ];
    await knex("why_features").insert(
      FEATURES.map((f, idx) => ({
        product_id: secops.id,
        icon: f.icon,
        title: f.title,
        description: f.description,
        sort_order: idx,
      })),
    );
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("why_features");
};
