-- ToggleNow Experience Center — production schema (MySQL 8+)
-- Generated from server/dev.sqlite3 as of migration_25_add_image_url_to_capabilities.
--
-- Import this ONCE into a fresh database, then import content-data.sql for the
-- real product/capability/story/Why/AI-Q&A/page content. Do NOT run this against
-- a database that already has data — it will fail on the CREATE TABLE statements
-- (by design, so you don't accidentally wipe a live site).
--
-- cPanel: phpMyAdmin → your database → Import → choose this file → Go.
-- Then repeat Import for content-data.sql.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `admins` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `description` text,
  `capabilities_tags` text,
  `time` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `cta` varchar(255) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `email_invites` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `device_fingerprint` varchar(255) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `device_lock` tinyint(1) NOT NULL DEFAULT '1',
  `duration_hours` int NOT NULL DEFAULT '24',
  `security_code_hash` varchar(255) DEFAULT NULL,
  `code_attempts` int NOT NULL DEFAULT '0',
  `single_use` tinyint(1) NOT NULL DEFAULT '1',
  `use_count` int NOT NULL DEFAULT '0',
  `filled_name` varchar(255) DEFAULT NULL,
  `progress_percent` int NOT NULL DEFAULT '0',
  `progress_steps` text,
  `progress_updated_at` timestamp NULL DEFAULT NULL,
  `product_slug` varchar(255) DEFAULT NULL,
  `admin_notified` tinyint(1) NOT NULL DEFAULT '0',
  `videos_watched` int NOT NULL DEFAULT '0',
  `videos_total` int NOT NULL DEFAULT '0',
  `allowed_product_slugs` text,
  `access_requested_at` timestamp NULL DEFAULT NULL,
  `usage_limit` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_invites_token_hash_unique` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `capabilities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `duration` varchar(255) DEFAULT NULL,
  `summary` text,
  `features` text,
  `value` text,
  `video_url` varchar(255) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `product_id` int unsigned DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `capabilities_slug_unique` (`slug`),
  KEY `capabilities_product_id_foreign` (`product_id`),
  CONSTRAINT `capabilities_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `metric` varchar(255) DEFAULT NULL,
  `challenge` text,
  `solution` text,
  `results` text,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `product_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stories_slug_unique` (`slug`),
  KEY `stories_product_id_foreign` (`product_id`),
  CONSTRAINT `stories_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `why_features` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `icon` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `why_features_product_id_foreign` (`product_id`),
  CONSTRAINT `why_features_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_qa` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `question` varchar(255) NOT NULL,
  `answer` text,
  `topic` varchar(255) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ai_qa_product_id_foreign` (`product_id`),
  CONSTRAINT `ai_qa_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `experience_pages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `page` varchar(255) NOT NULL,
  `headline` varchar(255) DEFAULT NULL,
  `description` text,
  `extra` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `experience_pages_product_id_page_unique` (`product_id`, `page`),
  CONSTRAINT `experience_pages_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bootstrap_state` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `seeded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cookie_consents` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `device_id` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip` varchar(255) DEFAULT NULL,
  `consented_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cookie_consents_device_id_index` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invite_product_progress` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `invite_id` int unsigned NOT NULL,
  `product_slug` varchar(255) NOT NULL,
  `progress_percent` int NOT NULL DEFAULT '0',
  `progress_steps` text,
  `videos_watched` int NOT NULL DEFAULT '0',
  `videos_total` int NOT NULL DEFAULT '0',
  `admin_notified` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_product_progress_invite_id_product_slug_unique` (`invite_id`, `product_slug`),
  CONSTRAINT `invite_product_progress_invite_id_foreign` FOREIGN KEY (`invite_id`) REFERENCES `email_invites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invite_product_access_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `invite_id` int unsigned NOT NULL,
  `product_slug` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_product_access_requests_invite_id_product_slug_unique` (`invite_id`, `product_slug`),
  CONSTRAINT `invite_product_access_requests_invite_id_foreign` FOREIGN KEY (`invite_id`) REFERENCES `email_invites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_notify_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_slug` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_notify_requests_product_slug_email_unique` (`product_slug`, `email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `workshop_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `invite_id` int unsigned NOT NULL,
  `product_slug` varchar(255) NOT NULL,
  `interests` text,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `workshop_requests_invite_id_foreign` FOREIGN KEY (`invite_id`) REFERENCES `email_invites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knex's own bookkeeping tables — pre-populating these marks every migration as
-- already applied, so `db.migrate.latest()` on first boot is a safe no-op
-- instead of trying (and failing) to re-run CREATE TABLE against tables that
-- already exist above.
CREATE TABLE `knex_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `knex_migrations_lock` (
  `index` int unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `knex_migrations_lock` (`index`, `is_locked`) VALUES (1, 0);

INSERT INTO `knex_migrations` (`name`, `batch`, `migration_time`) VALUES
('migration_01_create_admins.js', 1, NOW()),
('migration_02_create_products.js', 1, NOW()),
('migration_03_create_capabilities.js', 1, NOW()),
('migration_04_create_stories.js', 1, NOW()),
('migration_05_create_email_invites.js', 1, NOW()),
('migration_06_add_invite_options.js', 1, NOW()),
('migration_07_add_security_code.js', 1, NOW()),
('migration_08_add_usage_limit.js', 1, NOW()),
('migration_09_add_filled_name.js', 1, NOW()),
('migration_10_add_product_id_to_capabilities_and_stories.js', 1, NOW()),
('migration_11_create_why_features.js', 1, NOW()),
('migration_12_create_ai_qa.js', 1, NOW()),
('migration_13_create_experience_pages.js', 1, NOW()),
('migration_14_add_progress_tracking.js', 1, NOW()),
('migration_15_add_video_progress_tracking.js', 1, NOW()),
('migration_16_create_bootstrap_state.js', 1, NOW()),
('migration_17_add_admin_selected_products.js', 1, NOW()),
('migration_18_create_cookie_consents.js', 1, NOW()),
('migration_19_add_access_request.js', 1, NOW()),
('migration_20_add_usage_limit.js', 1, NOW()),
('migration_21_create_invite_product_progress.js', 1, NOW()),
('migration_22_create_invite_product_access_requests.js', 1, NOW()),
('migration_23_create_product_notify_requests.js', 1, NOW()),
('migration_24_create_workshop_requests.js', 1, NOW()),
('migration_25_add_image_url_to_capabilities.js', 1, NOW());

-- Deliberately NOT inserting a `bootstrap_state` row here. Leaving it empty
-- means the app's normal first-boot flow (server/index.js ensureDatabaseReady)
-- still runs once: it calls db.seed.run(), which now only finds
-- seed_02_admin.js (the demo-content seed was deleted), so the very first
-- Passenger boot creates your admin account from the ADMIN_EMAIL/
-- ADMIN_PASSWORD env vars and then writes the bootstrap_state row itself —
-- no bcrypt hash to hand-compute here, no dummy content ever inserted.

SET FOREIGN_KEY_CHECKS = 1;
