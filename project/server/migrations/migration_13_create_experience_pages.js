exports.up = async function (knex) {
  await knex.schema.createTable("experience_pages", (table) => {
    table.increments("id").primary();
    table.integer("product_id").unsigned().notNullable().references("id").inTable("products");
    table.string("page").notNullable(); // "why" | "ai"
    table.string("headline");
    table.text("description");
    table.text("extra"); // JSON-stringified object
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.unique(["product_id", "page"]);
  });

  const secops = await knex("products").where({ slug: "secops" }).first();
  if (secops) {
    await knex("experience_pages").insert([
      {
        product_id: secops.id,
        page: "why",
        headline: "Why enterprise SAP teams choose SecOps",
        description:
          "A quick tour of the problems SecOps solves, why the manual approach breaks down, and what changes on day one.",
        extra: JSON.stringify({ videoTitle: "Walkthrough Demo", videoDuration: "2 min 48 sec" }),
      },
      {
        product_id: secops.id,
        page: "ai",
        headline: "Ask the SecOps expert anything",
        description:
          "Get instant, accurate answers about SAP compatibility, architecture, licensing, and rollout — with references you can hand to your team.",
        extra: JSON.stringify({
          introMessage:
            "I'm the SecOps expert. Ask me about compatibility, architecture, licensing, or implementation. Pick a suggested question or type your own.",
        }),
      },
    ]);
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("experience_pages");
};
