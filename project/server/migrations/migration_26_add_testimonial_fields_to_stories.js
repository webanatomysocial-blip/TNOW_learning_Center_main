// Powers the redesigned Customer Stories card + popup: a photo-led card and a
// quote/testimonial popup with two supporting stat tiles, instead of the old
// plain challenge/solution/results text dump.
exports.up = function (knex) {
  return knex.schema.alterTable("stories", (table) => {
    table.string("photo_url").nullable();
    table.string("person_name").nullable();
    table.string("person_title").nullable();
    table.string("stat1_value").nullable();
    table.string("stat1_label").nullable();
    table.string("stat1_description").nullable();
    table.string("stat2_value").nullable();
    table.string("stat2_label").nullable();
    table.string("stat2_description").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("stories", (table) => {
    table.dropColumn("photo_url");
    table.dropColumn("person_name");
    table.dropColumn("person_title");
    table.dropColumn("stat1_value");
    table.dropColumn("stat1_label");
    table.dropColumn("stat1_description");
    table.dropColumn("stat2_value");
    table.dropColumn("stat2_label");
    table.dropColumn("stat2_description");
  });
};
