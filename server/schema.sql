-- ToggleNow Experience Center — production MySQL schema + seed content
--
-- Generated from server/migrations/*.js (19 migrations, run against a real
-- MySQL 8 instance) plus the current marketing content (products,
-- capabilities, customer stories, etc.) via mysqldump.
--
-- You do NOT need to run this by hand: server/index.js already runs
-- `knex migrate:latest` automatically on every boot (see ensureDatabaseReady()
-- in index.js), which is how this app deploys to shared hosting
-- (cPanel/Passenger) without shell/SSH access. Import this file only if you
-- need to pre-provision a production database ahead of first boot — after
-- importing, also run `npm run migrate` once so knex's own `knex_migrations`
-- bookkeeping table gets created and populated; otherwise the app will try to
-- re-run migration 1 on first boot and fail on "table already exists".
--
-- Deliberately EXCLUDES data (schema only, no rows) for:
--   admins            — real password hashes; the app seeds its own initial
--                        admin from ADMIN_EMAIL/ADMIN_PASSWORD in .env on
--                        first boot (server/seeds/seed_02_admin.js). Importing
--                        dev admin rows here would ship a dev password hash to
--                        production AND make the app think it's already
--                        bootstrapped, skipping that seed entirely.
--   email_invites     — real customer email addresses + security-code hashes
--                        from local testing; not production data.
--   cookie_consents    — per-visitor tracking rows; not meaningful to replay
--                        into a fresh production database.
--   bootstrap_state    — a flag row that marks "the one-time seed already
--                        ran". Must stay absent so the ADMIN_EMAIL/
--                        ADMIN_PASSWORD seed above actually fires on first
--                        production boot.
--
-- Data IS included for: products, capabilities, stories, why_features,
-- ai_qa, experience_pages — the actual marketing/content tables (currently
-- only products + capabilities are populated in this dev database; the rest
-- import as empty and can be filled in from the admin panel).
--
-- Known data issue carried over as-is from dev: all 6 rows in `capabilities`
-- reference product_id 36, which doesn't exist in `products` (ids 46-50) —
-- an orphaned reference from earlier dev testing. FOREIGN_KEY_CHECKS is
-- disabled during this import so it won't block the import, but you should
-- reassign those capabilities to the correct product from the admin panel
-- after import.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ── Schema only — no data (see note above) ─────────────────────────────────
DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `email_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_invites_token_hash_unique` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cookie_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bootstrap_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bootstrap_state` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `seeded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


-- ── Schema + seed content data ──────────────────────────────────────────────
DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (46,'secops','SecOps','SAP Security Operations, automated.','Automate SAP user provisioning, SoD analysis, license optimization, and emergency access — end to end.','[\"User Mgmt\",\"SoD\",\"Licenses\",\"Workflow\"]','12 min','available','Start Experience',1,'2026-07-29 08:09:52','2026-07-29 08:09:52'),(47,'fftrust','FF Trust','Firefighter access with zero blind spots.','Session recording, log analytics, and risk scoring for privileged SAP access.','[\"Firefighter\",\"Log Review\",\"Risk Scoring\"]','10 min','coming','Notify Me',2,'2026-07-29 08:09:52','2026-07-29 08:09:52'),(48,'reviewnow','ReviewNow','Access recertification without the spreadsheets.','Automate periodic user access reviews with policy-driven campaigns and audit trails.','[\"Campaigns\",\"Attestation\",\"Audit\"]','8 min','coming','Notify Me',3,'2026-07-29 08:09:52','2026-07-29 08:09:52'),(49,'gams360','GAMS360','Governance, Access & Monitoring, unified.','A single control plane for SAP GRC across systems and landscapes.','[\"GRC\",\"Monitoring\",\"Analytics\"]','10 min','coming','Notify Me',4,'2026-07-29 08:09:52','2026-07-29 08:09:52'),(50,'digybots','Digybots','Intelligent bots for SAP operations.','Automate repetitive SAP Basis and security operations with policy-safe bots.','[\"Automation\",\"Basis\",\"Ops\"]','9 min','coming','Notify Me',5,'2026-07-29 08:09:52','2026-07-29 08:09:52');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
DROP TABLE IF EXISTS `capabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `capabilities_slug_unique` (`slug`),
  KEY `capabilities_product_id_foreign` (`product_id`),
  CONSTRAINT `capabilities_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `capabilities` DISABLE KEYS */;
INSERT INTO `capabilities` VALUES (43,'user-management','User Management','2:14','Provision and deprovision SAP users across ECC and S/4 landscapes with a single workflow.','[\"Cross-system provisioning (ECC, S/4, BW, HANA)\",\"HR-driven joiner/mover/leaver\",\"Role-based approvals\",\"Real-time sync with SAP IdM\"]','Reduce provisioning time from days to minutes and cut helpdesk tickets by up to 50%.',NULL,1,'2026-07-29 08:09:52','2026-07-29 08:09:52',36),(44,'self-service','Self Service','1:58','Empower business users to request SAP access through a branded, policy-driven portal.','[\"Guided access catalog\",\"Business-friendly language\",\"Risk-aware approvals\",\"Full audit trail\"]','Deflect 60%+ of L1 tickets while keeping approvers in control.',NULL,2,'2026-07-29 08:09:52','2026-07-29 08:09:52',36),(45,'sod','Segregation of Duties','2:41','Detect and remediate SoD conflicts before they hit production, not after the audit.','[\"Real-time SoD simulation\",\"Ruleset library (SAP + custom)\",\"Mitigating controls\",\"Executive dashboards\"]','Ship access changes with confidence and stay continuously audit-ready.',NULL,3,'2026-07-29 08:09:52','2026-07-29 08:09:52',36),(46,'license','License Optimization','2:02','Right-size SAP licenses by matching actual usage to license type — automatically.','[\"Usage classification\",\"License reclassification\",\"Cost forecasts\",\"SAP LAW integration\"]','Typical savings of 15–30% on annual SAP license spend.',NULL,4,'2026-07-29 08:09:52','2026-07-29 08:09:52',36),(47,'workflow','Workflow','1:47','Configurable approval flows that mirror how your organization actually works.','[\"No-code designer\",\"Parallel & conditional steps\",\"SLA tracking\",\"Escalations\"]','Standardize governance across regions without slowing the business down.',NULL,5,'2026-07-29 08:09:52','2026-07-29 08:09:52',36),(48,'role-management','Role Management','2:23','Design, review, and maintain SAP roles with built-in risk analysis.','[\"Role designer\",\"Impact analysis\",\"Version control\",\"Bulk maintenance\"]','Keep your role catalog clean, current, and compliant.',NULL,6,'2026-07-29 08:09:52','2026-07-29 08:09:52',36);
/*!40000 ALTER TABLE `capabilities` ENABLE KEYS */;
DROP TABLE IF EXISTS `stories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `stories` DISABLE KEYS */;
/*!40000 ALTER TABLE `stories` ENABLE KEYS */;
DROP TABLE IF EXISTS `why_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `why_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `why_features` ENABLE KEYS */;
DROP TABLE IF EXISTS `ai_qa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `ai_qa` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_qa` ENABLE KEYS */;
DROP TABLE IF EXISTS `experience_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  UNIQUE KEY `experience_pages_product_id_page_unique` (`product_id`,`page`),
  CONSTRAINT `experience_pages_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `experience_pages` DISABLE KEYS */;
/*!40000 ALTER TABLE `experience_pages` ENABLE KEYS */;


SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;
