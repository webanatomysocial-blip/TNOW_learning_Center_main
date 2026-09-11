// Lets an admin attach an uploaded PDF (case study, one-pager) to a story and
// customize the button label — previously "Download PDF" was hardcoded and
// didn't link anywhere.
exports.up = function (knex) {
  return knex.schema.alterTable("stories", (table) => {
    table.string("download_url").nullable();
    table.string("download_label").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("stories", (table) => {
    table.dropColumn("download_url");
    table.dropColumn("download_label");
  });
};
