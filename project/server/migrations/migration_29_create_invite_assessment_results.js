// Stores the SecOps Engagement Fit Assessment (12-question quiz) result per
// invite/product so the admin panel can show what a customer answered, and so
// the completion-notification email has something durable to point back to.
// One row per invite+product — a retake overwrites the previous answers.
exports.up = function (knex) {
  return knex.schema.createTable("invite_assessment_results", (table) => {
    table.increments("id").primary();
    table
      .integer("invite_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("email_invites")
      .onDelete("CASCADE");
    table.string("product_slug").notNullable();
    table.integer("score").notNullable();
    table.string("tier_id").nullable(); // e.g. "option1" / "option2" / "option3"
    table.string("tier_name").nullable();
    table.text("answers").notNullable(); // JSON array of { dim, question, answer, flag }
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.unique(["invite_id", "product_slug"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("invite_assessment_results");
};
