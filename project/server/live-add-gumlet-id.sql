-- Brings a live database (dumped as kaphimosol9_tnow (2).sql, migrations up to
-- migration_27) up to date with migration_28_add_gumlet_id_to_capabilities.js.
-- Safe to run once against that live database via phpMyAdmin → Import (or SQL tab).

ALTER TABLE `capabilities`
  ADD COLUMN `gumlet_id` varchar(255) DEFAULT NULL AFTER `image_url`;

-- Record the migration as applied so the app's auto-migrate-on-boot (Knex)
-- doesn't try to run migration_28 again on next deploy.
INSERT INTO `knex_migrations` (`name`, `batch`, `migration_time`)
VALUES ('migration_28_add_gumlet_id_to_capabilities.js', 3, NOW());
