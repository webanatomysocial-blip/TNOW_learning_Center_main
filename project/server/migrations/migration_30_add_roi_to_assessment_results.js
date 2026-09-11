// Adds the ROI calculator's inputs + computed results onto the same per-invite
// per-product assessment row — so the admin gets the full picture (quiz answers
// AND the ROI numbers the customer landed on), not just the Q&A.
exports.up = function (knex) {
  return knex.schema.alterTable("invite_assessment_results", (table) => {
    table.text("roi_config").nullable(); // JSON: currency, costPerFte, productiveHoursMonth, tasks[]
    table.text("roi_results").nullable(); // JSON: computed hourlyRate, annualSavings, ftesReleased, etc.
    table.timestamp("roi_updated_at").nullable();
    // Relaxed so a row can exist for ROI-only submissions (e.g. a customer who
    // reached the recommendation page — score defaults to 24 client-side —
    // without having answered the quiz first).
    table.integer("score").nullable().alter();
    table.text("answers").nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("invite_assessment_results", (table) => {
    table.dropColumn("roi_config");
    table.dropColumn("roi_results");
    table.dropColumn("roi_updated_at");
  });
};
