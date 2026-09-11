// An invite can be scoped to (or left open to) more than one product — the
// customer might explore several. A single flat progress_percent/product_slug
// pair on email_invites can't represent that without one product's progress
// silently clobbering another's the moment they switch. This table tracks
// progress per (invite, product) pair instead, so each product's own progress
// — and its own "crossed 40%" notification — stays correct independently.
exports.up = async function (knex) {
  await knex.schema.createTable("invite_product_progress", (table) => {
    table.increments("id").primary();
    table
      .integer("invite_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("email_invites")
      .onDelete("CASCADE");
    table.string("product_slug").notNullable();
    table.integer("progress_percent").notNullable().defaultTo(0);
    table.text("progress_steps").nullable();
    table.integer("videos_watched").notNullable().defaultTo(0);
    table.integer("videos_total").notNullable().defaultTo(0);
    table.boolean("admin_notified").notNullable().defaultTo(false);
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.unique(["invite_id", "product_slug"]);
  });

  // Backfill: carry forward whatever single-product progress already exists on
  // email_invites so nothing already recorded is lost by this switch.
  const existing = await knex("email_invites")
    .whereNotNull("product_slug")
    .where("progress_percent", ">", 0)
    .select(
      "id",
      "product_slug",
      "progress_percent",
      "progress_steps",
      "videos_watched",
      "videos_total",
      "admin_notified",
      "progress_updated_at",
    );

  if (existing.length) {
    await knex("invite_product_progress").insert(
      existing.map((row) => ({
        invite_id: row.id,
        product_slug: row.product_slug,
        progress_percent: row.progress_percent,
        progress_steps: row.progress_steps,
        videos_watched: row.videos_watched,
        videos_total: row.videos_total,
        admin_notified: row.admin_notified,
        updated_at: row.progress_updated_at || new Date(),
      })),
    );
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("invite_product_progress");
};
