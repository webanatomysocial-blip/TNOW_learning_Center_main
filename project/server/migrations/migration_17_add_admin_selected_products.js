// Lets an admin restrict an invite to specific products at send time — separate
// from `product_slug`, which instead records what the customer actually opened.
exports.up = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    // JSON-stringified array of product slugs, e.g. ["secops","fftrust"]. Empty/null
    // means "no restriction" (all products shown), keeping existing invites unaffected.
    table.text("allowed_product_slugs").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("email_invites", (table) => {
    table.dropColumn("allowed_product_slugs");
  });
};
