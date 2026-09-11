// Captures the on-site "Book Workshop" form before handing off to the TidyCal/
// Calendly embed — previously that form's notes field wasn't stored anywhere at
// all. TidyCal has no public API for creating a booking with our own custom
// data (only name/email prefill via URL is supported), so this is the record
// of record for what the customer actually asked for, independent of whether
// they complete the external booking.
exports.up = function (knex) {
  return knex.schema.createTable("workshop_requests", (table) => {
    table.increments("id").primary();
    table
      .integer("invite_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("email_invites")
      .onDelete("CASCADE");
    table.string("product_slug").notNullable();
    table.text("interests").nullable(); // JSON array of strings
    table.text("notes").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("workshop_requests");
};
