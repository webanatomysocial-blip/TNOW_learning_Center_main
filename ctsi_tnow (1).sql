-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 08, 2026 at 04:25 PM
-- Server version: 10.11.18-MariaDB-cll-lve
-- PHP Version: 8.4.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ctsi_tnow`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `email`, `password_hash`, `created_at`) VALUES
(1, 'admin@togglenow.com', '$2a$10$CRscTWgfwxDP837mT9ix6OofDikuY2EXFTT4GnbCurred.MmanfUS', '2026-08-13 12:50:25');

-- --------------------------------------------------------

--
-- Table structure for table `ai_qa`
--

CREATE TABLE `ai_qa` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `question` varchar(255) NOT NULL,
  `answer` text DEFAULT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ai_qa`
--

INSERT INTO `ai_qa` (`id`, `product_id`, `question`, `answer`, `topic`, `sort_order`, `created_at`, `updated_at`) VALUES
(51, 1, 'Who owns SAP security end to end in your organization?', 'Most organizations struggle to answer this cleanly. Your AMS or SI partner runs operations but does not own the security outcome. Enterprise security provides oversight with limited bandwidth inside SAP. External auditors validate periodically and then move on. Everyone participates, and no one owns it.', 'Ownership', 0, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(52, 1, 'Our SAP security team is already fully occupied. Are they not doing this?', 'Ask what they actually worked on last month. In most organizations the answer is user IDs, role assignments, access requests and incident tickets. That work has to happen and it keeps the business moving, but none of it makes SAP more secure. Securing the system is a different set of activities: hardening configuration and parameters, closing gaps around standard and interface users, monitoring privileged use, keeping SoD rules current, acting on security notes, switching on native controls.

All these are on the list and are never touched unless there is an audit observation or recommendation. SAP security is beyond ticket handling.', 'Team Capacity', 1, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(53, 1, 'We already have SAP GRC, an AMS partner and an audit team. Why is that not enough?', 'The tools are rarely the problem. In most landscapes GRC is used for basic compliance workflows while manual effort stays high. Native capabilities are under-utilized. In our experience, many of the organizations only use 2-3 modules in SAP GRC. Additionally tools like RAL, UCON and SOS are available but are never implemented. Security expertise arrives for a project or an audit and then leaves. What is missing is the operating model, not the software you already own.', 'Tools & GRC', 2, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(54, 1, 'Our audits are clean. Why should we change anything?', 'A clean audit tells you the controls were evidenced on a given date. It does not tell you risk is coming down in between. The cost usually shows up somewhere else: slow provisioning that holds up your users, the same observations repeating year after year, a scramble for evidence before a regulatory review, and leadership working from reports that are already out of date. Check our calculator to know more on how SecOps can save.', 'Audit Readiness', 3, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(55, 1, 'How do we know if our SAP security and GRC program has stopped improving?', 'Most enterprises implement SAP security and GRC processes and then continue with the same way of working for years. You may be at this stage if your security team mainly handles tickets and is measured by SLAs rather than risk, if access reviews happen only at fixed intervals instead of continuously, and if you cannot clearly show how your security and governance are improving over time.', 'Program Maturity', 4, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(56, 1, 'What is SecOps in one line?', 'SAP security run as a continuous operating capability, using Subject matter experts (SMEs), governed processes, an automation platform and AI, instead of disconnected projects and periodic reviews.', 'Overview', 5, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(57, 1, 'Is this a product or a service?', 'Both, and the difference matters commercially. You get advisory input, a team running day to day operations under agreed service levels, and a platform on SAP BTP or Microsoft Azure that automates access governance workflows and reporting.', 'Model', 6, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(58, 1, 'How is this different from what our AMS partner already does?', 'AMS is measured on tickets closed and SLAs met. SecOps is measured on automations delivered, processes optimized, controls executed and risk reduced. Controls run on schedule instead of on request, monitoring picks up anomalies and SoD conflicts before they turn into audit findings, and you see control health continuously rather than at review time.', 'vs AMS', 7, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(59, 1, 'Does this replace SAP GRC?', 'No. It puts your existing GRC and your SAP native capabilities to work, and adds automation, monitoring and reporting on top. You get more out of what you have already bought.', 'GRC Compatibility', 8, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(60, 1, 'Does this replace our internal SAP security team?', 'No. The repetitive work moves to the automation layer and to our team, so your specialists can take on higher value work. We would also advise against positioning this internally as a headcount saving. The people whose cooperation you need are exactly the ones it would worry.', 'Internal Team', 9, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(61, 1, 'If your team runs our access operations, who owns the risk?', 'You do. Accountability for the control environment stays with you. What changes is who performs the work, how consistently it runs, and the evidence and reporting you get out of it.', 'Risk Ownership', 10, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(62, 1, 'Is there a segregation issue if the same partner administers access and also advises on controls?', 'Not exactly. But you must check if your partner is capable of both access governance and control management.', 'Segregation', 11, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(63, 1, 'What access will your team hold in our SAP systems?', 'Only BaU support access for the activities that still need to be carried out manually. Many of the activities are automated.', 'Access Scope', 12, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(64, 1, 'How is your own team\'s activity monitored?', 'We have structured methodologies and approaches to manage the team\'s activity. Additionally, every activity is recorded in the support portal.', 'Team Oversight', 13, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(65, 1, 'Where does our data sit, and is AI applied to it?', 'The platform runs in your own SAP BTP or Microsoft Azure subscription, and the AI capability works inside that environment. Where an external language model subscription is required, you contract and pay for it directly. ToggleNow can guide you on the right models that are needed and optimize the token utilization.', 'Data & AI', 14, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(66, 1, 'How does this start?', 'With a 30 day assessment of your current SAP security operating model. You get an as-is view, a gap assessment against best practice and compliance requirements, a compliance baseline and a roadmap, along with the quick wins you can act on straight away.', 'Onboarding', 15, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(67, 1, 'How long before we see change?', 'The journey runs in phases. Discover takes around 30 days. Stabilize runs 60 to 90 days (depends on the size of the landscape) as we take over BAU operations. Automate takes around 60 days and covers platform go live. Strengthen takes around 30 days and extends your SAP native controls. Optimize runs about 90 days and validates the outcomes with your management team. You move from reactive support to controlled operations, then automated governance, then preventive security.', 'Timeline', 16, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(68, 1, 'Do we have to commit to the whole journey?', 'It depends on the model that you are signing up with. ToggleNow\'s SecOps engagement is very flexible.', 'Commitment', 17, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(69, 1, 'What do you need from us?', 'A committed/dedicated team to roll-out the solution, all the documentation to understand the processes and auditor recommendations, if any.', 'Requirements', 18, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(70, 1, 'What happens if we want to exit?', 'You can continue using the solution and pay only for the subscription. No additional questions asked.', 'Exit', 19, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(71, 1, 'How is SecOps priced?', 'Pricing is based on numerous parameters such as systems, users, activities and so on. Our sales team can help you with the right proposal.', 'Pricing', 20, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(72, 1, 'What is included?', 'Platform deployment on SAP BTP or Azure, environment setup and technical installation, configuration of the SecOps modules in scope, workflows, standard risk rules, default approval flows and notifications, role based access for administrators and users, dashboards, reporting and alerts, integration with the agreed SAP landscape and one connector, authentication and SSO, testing support, production deployment and go live support, one month of stabilisation, one train the trainer session, and handover documentation.', 'Scope Included', 21, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(73, 1, 'What is not included?', 'Procurement of BTP, Azure or other licences, cloud infrastructure administration, custom development and bespoke integrations, custom reports or workflows beyond standard configuration, SAP upgrades, migrations and patching, remediation of existing authorization issues, role redesign and access cleanup, risk ruleset customization, data cleansing, and additional connectors or systems beyond the agreed scope.', 'Scope Excluded', 22, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(74, 1, 'Are cloud and AI costs included?', 'No. Cloud consumption, hyperscaler fees, SAP BTP and Azure charges, third party software licences, connectors and external language model subscriptions are contracted and paid by the customer directly.', 'Cloud & AI Costs', 23, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(75, 1, 'What are the contract terms?', 'The minimum contract is for 12 months. Detailed contract terms are outlined in the proposal and the Statement of Work. If you still have questions, feel free to connect to our team.', 'Contract Terms', 24, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(76, 1, 'What service levels apply?', 'SLAs are purely tied to the model that you choose. A detailed SLA documentation will be shared with you and is officially executed before start of the engagement.', 'SLAs', 25, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(77, 1, 'What are the coverage hours?', 'Services are delivered remotely during standard business hours and from our Offshore knowledge centres (OKC) in Hyderabad and Mumbai. Round the clock production support, onsite support and end user helpdesk operations are outside the standard scope and would be quoted separately.', 'Coverage Hours', 26, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(78, 1, 'Can you work onsite?', 'We work remotely by default. Onsite attendance, travel and related expenses can be arranged and are charged in addition. This can be discussed/decided with the team.', 'Onsite Support', 27, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(79, 1, 'When is SecOps not the right fit?', 'Where SAP security already runs as a continuous function with clear end to end ownership, where your landscape is small enough that periodic manual governance is sufficient, or where you are not willing to give an outside party any operational role. The model works by transferring execution, not only advice.', 'Fit', 28, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(80, 1, 'Where does the SecOps platform run?', 'On SAP BTP or Microsoft Azure, in your own subscription. Deployment covers environment setup, technical installation of the required components, and baseline security hardening aligned to platform best practice.', 'Platform Hosting', 29, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(81, 1, 'How many SAP systems are covered?', 'One landscape and one connector are included in the standard scope. Additional connectors and systems are optional and quoted separately.', 'System Coverage', 30, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(82, 1, 'How is authentication handled?', 'Single sign on is configured between your identity provider and the SecOps platform, with role based access set up for administrators and users.', 'Authentication', 31, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(83, 1, 'What gets configured during implementation?', 'The SecOps modules in the agreed scope, approval workflows, standard risk rules, notifications, role based access, dashboards, reporting and alerts. This is followed by unit testing, system integration testing support and UAT support, with defect fixes inside the implementation scope. Activities such as role redesign, SoD cleanup or any other activities that are not explicitly agreed are considered out of scope.', 'Implementation', 32, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(84, 1, 'What happens at go live?', 'Production deployment support, go live assistance and one month of stabilisation support, one train the trainer session for your administrators, and handover of the configuration and technical documentation.', 'Go Live', 33, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(85, 1, 'How are scope changes handled?', 'Scope, timelines and deliverables follow the agreed requirements. New requirements or material changes go through change control and are quoted separately. Delays in your dependencies may affect timelines and milestones.', 'Scope Changes', 34, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(86, 1, 'Who owns what?', 'You retain ownership of your data and your pre-existing materials. ToggleNow retains ownership of its products, accelerators, methodologies, templates, know-how and independently developed intellectual property.', 'Ownership & IP', 35, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(87, 1, 'How is confidential information handled?', 'Each party keeps the other\'s non-public business, technical and commercial information confidential, for anything shared in connection with the engagement.', 'Confidentiality', 36, '2026-09-08 17:00:00', '2026-09-08 17:00:00'),
(31, 2, 'What is FF Trust monitoring exactly?', 'FF Trust continuously monitors every firefighter (privileged/emergency) session in SAP, capturing keystroke-level activity logs, transaction usage, and table changes for full auditability.', 'Monitoring', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(32, 2, 'How fast are firefighter sessions reviewed after use?', 'Session logs are packaged and routed to the assigned reviewer automatically within minutes of session close, with SLA reminders if review is overdue.', 'Review Workflow', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(33, 2, 'Can we set time-bound restrictions on privileged access?', 'Yes — every firefighter ID can be configured with a maximum session duration, and access is force-revoked the moment that window closes, regardless of whether the user logged out.', 'Access Control', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(34, 2, 'Does FF Trust flag risky transactions automatically?', 'Yes, high-risk transaction codes and table changes are auto-flagged in the review log so auditors don\'t have to comb through raw session data manually.', 'Risk Detection', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(35, 2, 'What audit evidence does FF Trust produce for compliance?', 'A tamper-evident audit trail per session — who requested access, why, what they did, and who reviewed it — exportable directly for SOX/internal audit evidence.', 'Compliance', 4, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(36, 3, 'What is a user access review (UAR) in ReviewNow?', 'A periodic campaign where managers and role owners re-certify that every user\'s SAP access is still appropriate — ReviewNow automates the scheduling, reminders, and evidence capture for that process.', 'Access Reviews', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(37, 3, 'How often should we run access recertification campaigns?', 'Most customers run quarterly reviews for standard access and monthly for high-risk/privileged roles; ReviewNow lets you configure different cadences per risk tier.', 'Best Practices', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(38, 3, 'What happens if a reviewer doesn\'t respond in time?', 'ReviewNow escalates automatically to the reviewer\'s manager after a configurable grace period, so campaigns don\'t stall waiting on one person.', 'Escalation', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(39, 3, 'Can ReviewNow auto-revoke access that fails a review?', 'Yes, when configured, access explicitly rejected in a review is automatically deprovisioned in SAP without a separate manual ticket.', 'Automation', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(40, 3, 'What reports come out of a completed campaign?', 'A full certification report per user, per reviewer, and per role — with sign-off timestamps — ready to hand to auditors as evidence of periodic access review.', 'Reporting', 4, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(41, 4, 'What problem does GAMS360 solve that individual tools don\'t?', 'GAMS360 is a unified control plane — it brings provisioning, SoD, firefighter monitoring, and access reviews into a single dashboard instead of four disconnected systems with four different data models.', 'Overview', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(42, 4, 'Does GAMS360 replace SecOps, FF Trust, and ReviewNow?', 'It\'s built on the same engines — think of GAMS360 as the consolidated view and control layer that sits on top when you need all three working together with shared risk scoring.', 'Product Fit', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(43, 4, 'How does the unified risk score get calculated?', 'It combines SoD conflict severity, firefighter session risk, and outstanding review debt per user into one weighted score, so you can prioritize remediation instead of chasing every alert.', 'Risk Scoring', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(44, 4, 'Can GAMS360 give leadership a single compliance dashboard?', 'Yes — GAMS360\'s executive dashboard rolls up access risk, review completion rate, and license utilization across your whole SAP landscape in one view.', 'Reporting', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(45, 4, 'Is GAMS360 suitable for multi-system SAP landscapes?', 'Yes, it\'s designed to aggregate across multiple SAP instances (ECC, S/4HANA, etc.) so governance doesn\'t fragment as your landscape grows.', 'Scalability', 4, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(46, 5, 'What kind of SAP Basis tasks can Digybots automate?', 'Digybots automates routine Basis work — system refreshes, client copies, transport releases, health checks, and scheduled housekeeping jobs — that normally eat a Basis admin\'s week.', 'Automation', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(47, 5, 'Does Digybots require custom scripting to set up?', 'No, most bots are configured through pre-built templates with parameters — no ABAP or shell scripting needed for standard tasks.', 'Setup', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(48, 5, 'Can Digybots run unattended overnight jobs?', 'Yes, bots can be scheduled and chained, with failure alerts routed to your team so overnight runs don\'t need someone watching the console.', 'Scheduling', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(49, 5, 'How does Digybots handle transport management?', 'It can auto-release, import, and validate transports across your landscape following your existing approval gates, cutting manual transport handling significantly.', 'Transport Management', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(50, 5, 'What\'s the typical time savings Basis teams see?', 'Customers typically report reclaiming 10-15 hours per week per Basis admin by automating recurring maintenance and transport tasks.', 'ROI', 4, '2026-08-14 11:32:00', '2026-08-14 11:32:00');

-- --------------------------------------------------------

--
-- Table structure for table `bootstrap_state`
--

CREATE TABLE `bootstrap_state` (
  `id` int(10) UNSIGNED NOT NULL,
  `seeded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bootstrap_state`
--

INSERT INTO `bootstrap_state` (`id`, `seeded_at`) VALUES
(1, '2026-08-13 12:50:25');

-- --------------------------------------------------------

--
-- Table structure for table `capabilities`
--

CREATE TABLE `capabilities` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `duration` varchar(255) DEFAULT NULL,
  `summary` text DEFAULT NULL,
  `features` text DEFAULT NULL,
  `value` text DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `product_id` int(10) UNSIGNED DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `gumlet_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `capabilities`
--

INSERT INTO `capabilities` (`id`, `slug`, `title`, `duration`, `summary`, `features`, `value`, `video_url`, `sort_order`, `created_at`, `updated_at`, `product_id`, `image_url`, `gumlet_id`) VALUES
(19, 'user-management', 'User Management', '2:14', 'Provision and deprovision SAP users across ECC and S/4 landscapes with a single workflow.', '[\"Cross-system provisioning (ECC\",\"S/4\",\"BW\",\"HANA)\",\"HR-driven joiner/mover/leaver\",\"Role-based approvals\",\"Real-time sync with SAP IdM\"]', 'Reduce provisioning time from days to minutes and cut helpdesk tickets by up to 50%.', '', 1, '2026-08-14 11:32:00', '2026-08-18 12:23:41', 1, '', '67c11c363e62e53909989066'),
(20, 'self-service', 'Self Service', '1:58', 'Empower business users to request SAP access through a branded, policy-driven portal.', '[\"Guided access catalog\",\"Business-friendly language\",\"Risk-aware approvals\",\"Full audit trail\"]', 'Deflect 60%+ of L1 tickets while keeping approvers in control.', NULL, 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 1, NULL, NULL),
(21, 'sod', 'Segregation of Duties', '2:41', 'Detect and remediate SoD conflicts before they hit production, not after the audit.', '[\"Real-time SoD simulation\",\"Ruleset library (SAP + custom)\",\"Mitigating controls\",\"Executive dashboards\"]', 'Ship access changes with confidence and stay continuously audit-ready.', NULL, 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 1, NULL, NULL),
(22, 'license', 'License Optimization', '2:02', 'Right-size SAP licenses by matching actual usage to license type — automatically.', '[\"Usage classification\",\"License reclassification\",\"Cost forecasts\",\"SAP LAW integration\"]', 'Typical savings of 15–30% on annual SAP license spend.', NULL, 4, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 1, NULL, NULL),
(23, 'workflow', 'Workflow', '1:47', 'Configurable approval flows that mirror how your organization actually works.', '[\"No-code designer\",\"Parallel & conditional steps\",\"SLA tracking\",\"Escalations\"]', 'Standardize governance across regions without slowing the business down.', NULL, 5, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 1, NULL, NULL),
(24, 'role-management', 'Role Management', '2:23', 'Design, review, and maintain SAP roles with built-in risk analysis.', '[\"Role designer\",\"Impact analysis\",\"Version control\",\"Bulk maintenance\"]', 'Keep your role catalog clean, current, and compliant.', NULL, 6, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 1, NULL, NULL),
(25, 'session-monitoring', 'Session Monitoring', '2:08', 'Capture keystroke-level activity for every firefighter session in real time.', '[\"Live session capture\",\"Transaction & table-change logging\",\"Risk-flagged actions\",\"Searchable session archive\"]', 'Full visibility into privileged access, without slowing anyone down.', NULL, 7, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 2, NULL, NULL),
(26, 'review-workflow', 'Review Workflow', '1:52', 'Route completed sessions to the right reviewer automatically, with SLA tracking.', '[\"Auto-assigned reviewers\",\"SLA reminders & escalation\",\"One-click approve/flag\",\"Review history per user\"]', 'Cut session review turnaround from weeks to days.', NULL, 8, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 2, NULL, NULL),
(27, 'risk-scoring', 'Risk Scoring', '2:15', 'Every session gets a risk score based on transaction sensitivity and behavior patterns.', '[\"Configurable risk weights\",\"High-risk transaction flags\",\"Trend dashboards\",\"Exportable audit evidence\"]', 'Focus reviewer time on the sessions that actually matter.', NULL, 9, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 2, NULL, NULL),
(28, 'campaign-builder', 'Campaign Builder', '1:58', 'Configure recertification campaigns by role, risk tier, or business unit.', '[\"Flexible campaign scopes\",\"Custom review cadences\",\"Bulk reviewer assignment\",\"Campaign templates\"]', 'Get a UAR campaign running in minutes, not days.', NULL, 10, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 3, NULL, NULL),
(29, 'reviewer-workflow', 'Reviewer Workflow', '2:04', 'A guided, mobile-friendly review experience for managers and role owners.', '[\"Certify/revoke per line item\",\"Delegation support\",\"Auto-escalation on inaction\",\"Bulk actions\"]', 'Higher review completion rates with less manager friction.', NULL, 11, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 3, NULL, NULL),
(30, 'audit-evidence', 'Audit Evidence', '1:41', 'Every certification decision is timestamped and exportable for auditors.', '[\"Full sign-off history\",\"Exportable campaign reports\",\"Access-change tracking\",\"SOX-ready evidence packages\"]', 'Walk into your next audit with evidence already assembled.', NULL, 12, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 3, NULL, NULL),
(31, 'unified-dashboard', 'Unified Dashboard', '2:20', 'Provisioning, SoD, firefighter monitoring, and reviews in a single view.', '[\"Cross-module risk view\",\"Role-based dashboards\",\"Drill-down to source module\",\"Custom widgets\"]', 'One login, one view, instead of four disconnected tools.', NULL, 13, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 4, NULL, NULL),
(32, 'risk-engine', 'Unified Risk Engine', '2:06', 'A single weighted risk score combining SoD conflicts, session risk, and review debt.', '[\"Configurable risk weighting\",\"Cross-module correlation\",\"Prioritized remediation queue\",\"Trend tracking over time\"]', 'Know exactly where to focus remediation effort first.', NULL, 14, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 4, NULL, NULL),
(33, 'executive-reporting', 'Executive Reporting', '1:49', 'Roll up access risk and compliance posture across your whole SAP landscape.', '[\"Multi-system aggregation\",\"Board-ready summaries\",\"Scheduled report delivery\",\"Drill-down detail views\"]', 'Give leadership one number that actually means something.', NULL, 15, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 4, NULL, NULL),
(34, 'bot-templates', 'Bot Templates', '1:55', 'Pre-built automation templates for the Basis tasks teams run every week.', '[\"Client copy & refresh templates\",\"Transport release bots\",\"Health-check schedules\",\"No-code parameter setup\"]', 'Automate routine Basis work without writing a script.', NULL, 16, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 5, NULL, NULL),
(35, 'scheduling', 'Scheduling & Chaining', '1:47', 'Chain bots into unattended pipelines with failure alerts.', '[\"Cron-style scheduling\",\"Multi-step bot chains\",\"Failure alerting\",\"Run history & logs\"]', 'Overnight maintenance that runs itself — and tells you if it didn\'t.', NULL, 17, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 5, NULL, NULL),
(36, 'transport-automation', 'Transport Automation', '2:11', 'Auto-release, import, and validate transports against your existing approval gates.', '[\"Approval-gated automation\",\"Cross-landscape validation\",\"Rollback on failure\",\"Full transport audit trail\"]', 'Cut manual transport handling time significantly, without bypassing governance.', NULL, 18, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 5, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cookie_consents`
--

CREATE TABLE `cookie_consents` (
  `id` int(10) UNSIGNED NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip` varchar(255) DEFAULT NULL,
  `consented_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cookie_consents`
--

INSERT INTO `cookie_consents` (`id`, `device_id`, `email`, `user_agent`, `ip`, `consented_at`) VALUES
(1, '35d3ed42-8e30-4e52-a780-1cc2de6e299f', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15', '171.78.178.178', '2026-08-13 13:20:07'),
(2, '09f377d2-ea43-45df-879b-47289e23904d', 'udaya@mosol9.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '171.78.178.178', '2026-08-14 11:37:16'),
(3, '3f2badca-0e2d-4a00-a99b-b49bc7993173', 'rb@shiftorbits.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '49.205.115.160', '2026-08-16 11:04:10'),
(4, '2aaf64f4-def9-455b-97f1-749da242abbf', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '171.78.178.178', '2026-08-17 06:52:32'),
(5, '0d6552c9-38cc-47d5-86c7-9f2e8414f15f', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '122.183.150.214', '2026-09-02 13:52:20');

-- --------------------------------------------------------

--
-- Table structure for table `email_invites`
--

CREATE TABLE `email_invites` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `device_fingerprint` varchar(255) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `device_lock` tinyint(1) NOT NULL DEFAULT 1,
  `duration_hours` int(11) NOT NULL DEFAULT 24,
  `security_code_hash` varchar(255) DEFAULT NULL,
  `code_attempts` int(11) NOT NULL DEFAULT 0,
  `single_use` tinyint(1) NOT NULL DEFAULT 1,
  `use_count` int(11) NOT NULL DEFAULT 0,
  `filled_name` varchar(255) DEFAULT NULL,
  `progress_percent` int(11) NOT NULL DEFAULT 0,
  `progress_steps` text DEFAULT NULL,
  `progress_updated_at` timestamp NULL DEFAULT NULL,
  `product_slug` varchar(255) DEFAULT NULL,
  `admin_notified` tinyint(1) NOT NULL DEFAULT 0,
  `videos_watched` int(11) NOT NULL DEFAULT 0,
  `videos_total` int(11) NOT NULL DEFAULT 0,
  `allowed_product_slugs` text DEFAULT NULL,
  `access_requested_at` timestamp NULL DEFAULT NULL,
  `usage_limit` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_invites`
--

INSERT INTO `email_invites` (`id`, `email`, `token_hash`, `status`, `device_fingerprint`, `sent_at`, `used_at`, `expires_at`, `created_at`, `updated_at`, `device_lock`, `duration_hours`, `security_code_hash`, `code_attempts`, `single_use`, `use_count`, `filled_name`, `progress_percent`, `progress_steps`, `progress_updated_at`, `product_slug`, `admin_notified`, `videos_watched`, `videos_total`, `allowed_product_slugs`, `access_requested_at`, `usage_limit`) VALUES
(1, 'nitish.vetcha@mosol9.in', '33d847adb9146b01b03a3b84e5280c8b5af4058b071af5edcffdbbadac4ffbf3', 'pending', '0d6552c9-38cc-47d5-86c7-9f2e8414f15f', '2026-09-02 13:51:37', NULL, '2026-09-09 13:51:37', '2026-08-13 12:58:02', '2026-09-02 13:51:43', 1, 168, '5dde69ee2b9932ef6ce3bd59d60e58689c99bee158a0066ad9cbff536f626427', 0, 0, 0, 'Nitish', 33, '[\"welcome\",\"stories\"]', '2026-08-14 11:33:12', 'secops', 0, 1, 6, '[\"secops\",\"fftrust\",\"reviewnow\",\"gams360\",\"digybots\"]', NULL, NULL),
(2, 'priya.k@mosol9.com', 'e8fe3033f1a48d185aa7582845c9b863fa4174622b5744d9f0feb10764e4c82d', 'used', '79f22b54-2c5a-440a-a4fb-56bba9d64a25', '2026-08-13 13:12:25', '2026-08-13 13:14:08', '2026-08-14 13:12:25', '2026-08-13 13:12:25', '2026-08-13 13:15:37', 1, 24, '79e0d6e7a1c38ee5ff21bd8dae64030419e1486aa4e8ea0aa9f279023304384d', 0, 1, 1, 'priya rao', 0, NULL, NULL, NULL, 0, 0, 0, '[\"secops\",\"fftrust\"]', NULL, NULL),
(3, 'srujan@mosol9.com', '067dabef79f1b3d5ac9d775a8f83a46a922769fca3295b6d6325a14dde6266a9', 'revoked', 'b07301dd-ee4e-4c66-8285-28bece809906', '2026-08-21 13:34:38', '2026-08-21 13:35:14', '2026-08-21 14:34:38', '2026-08-13 13:17:21', '2026-08-21 13:48:23', 1, 1, 'a2fd574d6ae9f91cdbde3605804b4176d8f833032b6bfb21d798f43d5ad0ee96', 0, 0, 1, 'Srujan', 50, '[\"welcome\",\"stories\",\"book\"]', '2026-08-21 11:34:56', 'secops', 0, 1, 6, NULL, NULL, NULL),
(4, 'hemanthgotru@gmail.com', 'ba5e64469b6cc175f67c7ab1b96099c2f0d8e2476298231964f8b6215fbac856', 'pending', NULL, '2026-08-14 07:45:38', '2026-08-14 11:34:00', '2026-08-17 07:45:38', '2026-08-14 07:45:38', '2026-08-14 11:34:00', 0, 72, '32443d6c102ff96ad69810b59e775a41e088939061a2b820cae11b46dea0e993', 0, 0, 1, 'Hemanth', 0, NULL, NULL, NULL, 0, 0, 0, '[\"secops\",\"fftrust\",\"reviewnow\",\"gams360\",\"digybots\"]', NULL, NULL),
(5, 'udaya@mosol9.com', '03eeec38ec8f18dd317f0640d99943e0022607d2a10c0efe34fcc5e47ab0c628', 'pending', NULL, '2026-09-03 04:45:20', NULL, '2026-09-03 05:45:20', '2026-08-14 11:36:41', '2026-09-03 04:45:20', 1, 1, '265b26728d9255085f6e96e30256eca88bd2e71854d73f6cbc7b32f338885647', 0, 1, 0, 'udaya', 50, '[\"welcome\",\"stories\",\"book\"]', '2026-08-19 12:39:51', 'secops', 0, 1, 6, '[\"secops\",\"reviewnow\",\"fftrust\"]', NULL, NULL),
(6, 'rb@togglenow.com', '6a0910878528c04d1f7999de96312209908e0b7f3bacd54643e409b2176dd206', 'used', '3f2badca-0e2d-4a00-a99b-b49bc7993173', '2026-08-14 11:42:33', '2026-08-14 11:43:07', '2026-08-14 12:42:33', '2026-08-14 11:42:33', '2026-08-14 11:43:07', 1, 1, '8d707c9daff4b88f382dcab4ac76a15aeb0c930f73981cbc9ca41152e689d756', 0, 1, 1, 'Raghu', 50, '[\"welcome\",\"ai\",\"book\"]', '2026-08-14 11:47:07', 'secops', 0, 0, 0, '[\"secops\",\"fftrust\",\"reviewnow\",\"gams360\",\"digybots\"]', NULL, NULL),
(7, 'rb@shiftorbits.com', '9ab10702e8a673433371e3890488fc80a90bb365fca0ffaf9527ee66a9056721', 'used', '3f2badca-0e2d-4a00-a99b-b49bc7993173', '2026-08-16 11:05:07', '2026-08-16 11:07:13', '2026-08-17 11:05:07', '2026-08-16 11:05:07', '2026-08-16 11:07:13', 1, 24, 'a6542456d8d7e187c501cdbf35047c1c2a51581c1596b0d1e4be649652e8459a', 0, 1, 1, 'Raghu', 83, '[\"welcome\",\"why\",\"stories\",\"ai\",\"book\"]', '2026-08-16 11:08:47', 'digybots', 0, 2, 3, '[\"secops\",\"digybots\"]', NULL, NULL),
(8, 'rb@shiftorbits.com', 'a238ec42cd2d1cd61393cc0137c81e31942e76dd3daa653b2ac7651c26f5e3d1', 'pending', NULL, '2026-09-02 11:06:48', NULL, '2026-09-02 12:06:48', '2026-08-19 02:29:33', '2026-09-02 11:06:48', 1, 1, 'a5e18d05fb4187e66171fd720a2cefd491a28901a5108be81b7da54cecc4d0c0', 0, 1, 0, 'Raghu', 33, '[\"welcome\",\"book\"]', '2026-08-19 02:34:29', 'secops', 0, 0, 0, '[\"secops\"]', NULL, NULL),
(9, 'srujanvinnakotta@gmail.com', '7803e0bc5c0a0940337875b376c7ed35104f2772190881ab7d073bf242920e19', 'pending', NULL, '2026-09-02 11:06:10', NULL, '2026-09-02 12:06:10', '2026-08-21 11:40:56', '2026-09-02 11:06:27', 1, 1, 'c2544a0b1181a933e9c2d616b534d466ac2e9aa6578607a0d26880354c78474c', 0, 0, 0, 'Srujan', 33, '[\"welcome\",\"stories\"]', '2026-08-21 11:42:49', 'fftrust', 0, 0, 0, '[\"fftrust\",\"secops\"]', NULL, 1),
(26, 'rb@shiftorbits.com', '77353e27897b38ce3fa2097c012dc67d5882b5a373da9a362e91da65b3b43149', 'pending', NULL, '2026-09-02 15:33:18', NULL, '2026-09-09 15:33:18', '2026-09-02 15:33:18', '2026-09-02 15:33:18', 1, 168, 'fc5385eb672718f92d15bf6b3405df1cfa940147067815c12fc1e894f88ff4c8', 0, 0, 0, NULL, 0, NULL, NULL, NULL, 0, 0, 0, '[\"secops\",\"fftrust\"]', NULL, 5),
(27, 'udayamosol9@gmail.com', 'e4ffb51d5032cdcd443c7e66d4d5aa559035de465faf082da430afb7aef867dc', 'pending', NULL, '2026-09-03 04:45:44', NULL, '2026-09-04 04:45:44', '2026-09-03 04:45:44', '2026-09-03 04:45:44', 1, 24, '3508e41c0c188a68d890cccfb58a36d49e8f37c170dcd04f54ac9fc33ff1d520', 0, 1, 0, NULL, 0, NULL, NULL, NULL, 0, 0, 0, '[\"digybots\"]', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `experience_pages`
--

CREATE TABLE `experience_pages` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `page` varchar(255) NOT NULL,
  `headline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `extra` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `experience_pages`
--

INSERT INTO `experience_pages` (`id`, `product_id`, `page`, `headline`, `description`, `extra`, `created_at`, `updated_at`) VALUES
(16, 1, 'why', 'Why enterprises choose SecOps', 'AI powered Access Governance platform with well-established processes.', '{\"videoTitle\":\"\",\"videoDuration\":\"\",\"videoUrl\":\"\",\"gumletId\":\"67c11c363e62e53909989066\"}', '2026-08-14 11:32:00', '2026-09-08 17:00:00'),
(17, 1, 'ai', 'Ask the SecOps expert', 'Get instant answers about provisioning, SoD, licensing, and emergency access.', '{\"introMessage\":\"Hi! I\'m here to answer questions about SecOps — provisioning, SoD checks, license optimization, or emergency access. What would you like to know?\"}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(18, 1, 'book', 'Book a SecOps workshop', 'Walk through your provisioning and SoD setup with our team.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(19, 2, 'why', 'Why teams choose FF Trust', 'Full visibility into every privileged SAP session, with reviews that actually keep up.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(20, 2, 'ai', 'Ask the FF Trust expert', 'Get instant answers about firefighter monitoring, session review, and audit evidence.', '{\"introMessage\":\"Hi! Ask me anything about FF Trust — firefighter monitoring, session review workflows, or audit evidence. What\'s on your mind?\"}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(21, 2, 'book', 'Book a FF Trust workshop', 'See how firefighter session monitoring fits your audit process.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(22, 3, 'why', 'Why teams choose ReviewNow', 'Access recertification campaigns that run themselves — and never miss a deadline.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(23, 3, 'ai', 'Ask the ReviewNow expert', 'Get instant answers about UAR campaigns, escalation, and audit reporting.', '{\"introMessage\":\"Hi! I can help with questions about ReviewNow — campaign scheduling, escalation rules, or audit reports. What would you like to know?\"}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(24, 3, 'book', 'Book a ReviewNow workshop', 'Plan your first automated recertification campaign with our team.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(25, 4, 'why', 'Why teams choose GAMS360', 'One control plane for provisioning, SoD, firefighter monitoring, and reviews.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(26, 4, 'ai', 'Ask the GAMS360 expert', 'Get instant answers about the unified control plane and risk scoring.', '{\"introMessage\":\"Hi! Ask me about GAMS360 — the unified dashboard, risk scoring, or multi-system coverage. What\'s on your mind?\"}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(27, 4, 'book', 'Book a GAMS360 workshop', 'See how a unified control plane could work across your SAP landscape.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(28, 5, 'why', 'Why teams choose Digybots', 'No-code Basis automation that gives your admins their week back.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(29, 5, 'ai', 'Ask the Digybots expert', 'Get instant answers about bot templates, scheduling, and transport automation.', '{\"introMessage\":\"Hi! I can answer questions about Digybots — bot templates, scheduling, or transport automation. What would you like to know?\"}', '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(30, 5, 'book', 'Book a Digybots workshop', 'Walk through which Basis tasks are the best fit to automate first.', '{}', '2026-08-14 11:32:00', '2026-08-14 11:32:00');

-- --------------------------------------------------------

--
-- Table structure for table `invite_assessment_results`
--

CREATE TABLE `invite_assessment_results` (
  `id` int(10) UNSIGNED NOT NULL,
  `invite_id` int(10) UNSIGNED NOT NULL,
  `product_slug` varchar(255) NOT NULL,
  `score` int(11) DEFAULT NULL,
  `tier_id` varchar(255) DEFAULT NULL,
  `tier_name` varchar(255) DEFAULT NULL,
  `answers` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `roi_config` text DEFAULT NULL,
  `roi_results` text DEFAULT NULL,
  `roi_updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `invite_assessment_results`
--

INSERT INTO `invite_assessment_results` (`id`, `invite_id`, `product_slug`, `score`, `tier_id`, `tier_name`, `answers`, `created_at`, `updated_at`, `roi_config`, `roi_results`, `roi_updated_at`) VALUES
(1, 1, 'secops', 24, 'option3', 'Platform Only', '[{\"dim\":\"PROVISIONING\",\"question\":\"How are user access requests approved and provisioned today?\",\"answer\":\"Fully automated workflow with role-based, rule-driven provisioning\",\"flag\":null},{\"dim\":\"SOD ANALYSIS\",\"question\":\"When is Segregation of Duties (SoD) analyzed in your access lifecycle?\",\"answer\":\"Preventively simulated in real-time before access is granted\",\"flag\":null},{\"dim\":\"RESOLUTION SPEED\",\"question\":\"On average, how long does it take to resolve an access-related issue or ticket?\",\"answer\":\"Under an hour, with automated routing and instant provisioning\",\"flag\":null},{\"dim\":\"EMERGENCY ACCESS\",\"question\":\"How is emergency, ad-hoc or firefighter access managed?\",\"answer\":\"Self-service elevation with automated workflow, full session replay & audit trails\",\"flag\":null},{\"dim\":\"USER ACCESS REVIEWS\",\"question\":\"How are periodic user access certifications and recertifications conducted?\",\"answer\":\"Automated campaign manager with one-click attestations and auto-deprovisioning\",\"flag\":null},{\"dim\":\"LIFECYCLE MANAGEMENT\",\"question\":\"How are employee role changes and terminations synchronized with SAP access?\",\"answer\":\"Real-time event-driven sync directly from HR / IdM system\",\"flag\":null},{\"dim\":\"LICENSE RIGHT-SIZING\",\"question\":\"How does your organization monitor and optimize SAP user license allocations?\",\"answer\":\"Continuous automated activity profiling with license downgrade recommendations\",\"flag\":null},{\"dim\":\"AUDIT READINESS\",\"question\":\"How much effort is required to prepare evidence for internal and external audits?\",\"answer\":\"Instant, continuous audit-ready reports generated with one click\",\"flag\":null},{\"dim\":\"ROLE GOVERNANCE\",\"question\":\"What is the current health and structure of your SAP authorization role catalog?\",\"answer\":\"Clean, business-aligned single roles with automated impact simulation\",\"flag\":null},{\"dim\":\"LANDSCAPE INTEGRATION\",\"question\":\"How are access controls governed across multiple SAP systems (ECC, S/4, BTP, Cloud)?\",\"answer\":\"Unified cross-system governance plane covering on-premise, cloud, and hybrid\",\"flag\":null},{\"dim\":\"CONTINUOUS MONITORING\",\"question\":\"How do you detect sensitive transaction usage or unauthorized role changes?\",\"answer\":\"Real-time automated alerting on critical t-codes and sensitive parameter changes\",\"flag\":null},{\"dim\":\"TEAM CAPACITY\",\"question\":\"How does your team manage the balance between day-to-day access requests and strategic security projects?\",\"answer\":\"Routine requests are largely automated; team focuses on strategic security posture\",\"flag\":null}]', '2026-08-18 12:15:30', '2026-08-21 11:14:08', NULL, NULL, NULL),
(2, 3, 'secops', 15, 'option2', 'Platform + Advisory', '[{\"dim\":\"PROVISIONING\",\"question\":\"How are user access requests approved and provisioned today?\",\"answer\":\"Fully automated workflow with role-based, rule-driven provisioning\",\"flag\":null},{\"dim\":\"SOD ANALYSIS\",\"question\":\"When is Segregation of Duties (SoD) analyzed in your access lifecycle?\",\"answer\":\"Manually checked during request approval using spreadsheets or periodic extracts\",\"flag\":null},{\"dim\":\"RESOLUTION SPEED\",\"question\":\"On average, how long does it take to resolve an access-related issue or ticket?\",\"answer\":\"Between 1 and 4 hours depending on approver availability\",\"flag\":null},{\"dim\":\"EMERGENCY ACCESS\",\"question\":\"How is emergency, ad-hoc or firefighter access managed?\",\"answer\":\"Temporary elevated accounts with manual sign-off and review\",\"flag\":null},{\"dim\":\"USER ACCESS REVIEWS\",\"question\":\"How are periodic user access certifications and recertifications conducted?\",\"answer\":\"Semi-automated campaign reports requiring manual reconciliation\",\"flag\":null},{\"dim\":\"LIFECYCLE MANAGEMENT\",\"question\":\"How are employee role changes and terminations synchronized with SAP access?\",\"answer\":\"Real-time event-driven sync directly from HR / IdM system\",\"flag\":null},{\"dim\":\"LICENSE RIGHT-SIZING\",\"question\":\"How does your organization monitor and optimize SAP user license allocations?\",\"answer\":\"Continuous automated activity profiling with license downgrade recommendations\",\"flag\":null},{\"dim\":\"AUDIT READINESS\",\"question\":\"How much effort is required to prepare evidence for internal and external audits?\",\"answer\":\"Instant, continuous audit-ready reports generated with one click\",\"flag\":null},{\"dim\":\"ROLE GOVERNANCE\",\"question\":\"What is the current health and structure of your SAP authorization role catalog?\",\"answer\":\"Partially standardized role design with occasional manual clean-up projects\",\"flag\":null},{\"dim\":\"LANDSCAPE INTEGRATION\",\"question\":\"How are access controls governed across multiple SAP systems (ECC, S/4, BTP, Cloud)?\",\"answer\":\"Centralized ticketing with separate manual administration teams per system\",\"flag\":null},{\"dim\":\"CONTINUOUS MONITORING\",\"question\":\"How do you detect sensitive transaction usage or unauthorized role changes?\",\"answer\":\"Weekly or monthly manual log reviews of SM20 / Security Audit Logs\",\"flag\":null},{\"dim\":\"TEAM CAPACITY\",\"question\":\"How does your team manage the balance between day-to-day access requests and strategic security projects?\",\"answer\":\"Team is completely overwhelmed by routine tickets; strategic security is neglected\",\"flag\":\"Security team capacity consumed entirely by routine ticket toil\"}]', '2026-08-18 12:20:48', '2026-08-21 13:46:17', '{\"currency\":\"INR\",\"costPerFte\":1800000,\"productiveHoursMonth\":160,\"tasks\":[{\"id\":\"pwd-resets\",\"name\":\"Password resets\",\"desc\":\"Self-service unlock & credentials renewal\",\"via\":\"AGENT\",\"ticketsPerMonth\":120,\"minManual\":10,\"minSecOps\":1},{\"id\":\"validity-ext\",\"name\":\"Validity extensions\",\"desc\":\"Temporary access window expiration renewal\",\"via\":\"AGENT\",\"ticketsPerMonth\":40,\"minManual\":12,\"minSecOps\":1},{\"id\":\"lock-unlock\",\"name\":\"Lock / unlock requests\",\"desc\":\"User status toggles and ad-hoc suspension\",\"via\":\"AGENT\",\"ticketsPerMonth\":60,\"minManual\":8,\"minSecOps\":1},{\"id\":\"user-creation\",\"name\":\"User creation / change requests\",\"desc\":\"Joiner/mover/leaver provisioning & role assignments\",\"via\":\"AGENT\",\"ticketsPerMonth\":80,\"minManual\":25,\"minSecOps\":4},{\"id\":\"su53-analysis\",\"name\":\"SU53 authorization analysis\",\"desc\":\"Failed check diagnostic and missing object analysis\",\"via\":\"AGENT\",\"ticketsPerMonth\":50,\"minManual\":30,\"minSecOps\":6},{\"id\":\"report-gen\",\"name\":\"Report generation\",\"desc\":\"Compliance extract, active user & t-code usage reports\",\"via\":\"AGENT\",\"ticketsPerMonth\":30,\"minManual\":20,\"minSecOps\":2},{\"id\":\"periodic-reviews\",\"name\":\"Periodic reviews (UAR / SoD)\",\"desc\":\"Manager recertification campaigns & attestation\",\"via\":\"PLATFORM\",\"ticketsPerMonth\":20,\"minManual\":45,\"minSecOps\":7},{\"id\":\"sod-remediation\",\"name\":\"SoD conflict remediation\",\"desc\":\"Conflict simulation, mitigation control assignment\",\"via\":\"PLATFORM\",\"ticketsPerMonth\":25,\"minManual\":40,\"minSecOps\":10},{\"id\":\"dormant-id\",\"name\":\"Dormant / critical ID mgmt\",\"desc\":\"Inactive account deactivation & privileged ID audits\",\"via\":\"PLATFORM\",\"ticketsPerMonth\":15,\"minManual\":30,\"minSecOps\":5},{\"id\":\"ff-access\",\"name\":\"Emergency (FF) access handling\",\"desc\":\"Firefighter elevation, session capture, log review\",\"via\":\"PLATFORM\",\"ticketsPerMonth\":20,\"minManual\":25,\"minSecOps\":3}]}', '{\"hourlyRate\":937.5,\"totalTickets\":460,\"totalMonthlyManualHours\":151.83333333333334,\"totalMonthlySecOpsHours\":23.75,\"monthlyHoursSaved\":128.08333333333334,\"fteManual\":0.9489583333333333,\"fteSecOps\":0.1484375,\"ftesReleased\":0.8005208333333333,\"monthlyCostManual\":142343.75,\"monthlyCostSecOps\":22265.625,\"monthlySavings\":120078.125,\"annualSavings\":1440937.5,\"annualCostManual\":1708125,\"annualCostSecOps\":267187.5,\"overallPctReduction\":84,\"taskBreakdown\":[{\"id\":\"pwd-resets\",\"name\":\"Password resets\",\"desc\":\"Self-service unlock & credentials renewal\",\"via\":\"AGENT\",\"ticketsPerMonth\":120,\"minManual\":10,\"minSecOps\":1,\"manualHours\":20,\"secOpsHours\":2,\"hoursSaved\":18,\"pctReduction\":90},{\"id\":\"validity-ext\",\"name\":\"Validity extensions\",\"desc\":\"Temporary access window expiration renewal\",\"via\":\"AGENT\",\"ticketsPerMonth\":40,\"minManual\":12,\"minSecOps\":1,\"manualHours\":8,\"secOpsHours\":0.6666666666666666,\"hoursSaved\":7.333333333333333,\"pctReduction\":92},{\"id\":\"lock-unlock\",\"name\":\"Lock / unlock requests\",\"desc\":\"User status toggles and ad-hoc suspension\",\"via\":\"AGENT\",\"ticketsPerMonth\":60,\"minManual\":8,\"minSecOps\":1,\"manualHours\":8,\"secOpsHours\":1,\"hoursSaved\":7,\"pctReduction\":88},{\"id\":\"user-creation\",\"name\":\"User creation / change requests\",\"desc\":\"Joiner/mover/leaver provisioning & role assignments\",\"via\":\"AGENT\",\"ticketsPerMonth\":80,\"minManual\":25,\"minSecOps\":4,\"manualHours\":33.333333333333336,\"secOpsHours\":5.333333333333333,\"hoursSaved\":28.000000000000004,\"pctReduction\":84},{\"id\":\"su53-analysis\",\"name\":\"SU53 authorization analysis\",\"desc\":\"Failed check diagnostic and missing object analysis\",\"via\":\"AGENT\",\"ticketsPerMonth\":50,\"minManual\":30,\"minSecOps\":6,\"manualHours\":25,\"secOpsHours\":5,\"hoursSaved\":20,\"pctReduction\":80},{\"id\":\"report-gen\",\"name\":\"Report generation\",\"desc\":\"Compliance extract, active user & t-code usage reports\",\"via\":\"AGENT\",\"ticketsPerMonth\":30,\"minManual\":20,\"minSecOps\":2,\"manualHours\":10,\"secOpsHours\":1,\"hoursSaved\":9,\"pctReduction\":90},{\"id\":\"periodic-reviews\",\"name\":\"Periodic reviews (UAR / SoD)\",\"desc\":\"Manager recertification campaigns & attestation\",\"via\":\"PLATFORM\",\"ticketsPerMonth\":20,\"minManual\":45,\"minSecOps\":7,\"manualHours\":15,\"secOpsHours\":2.3333333333333335,\"hoursSaved\":12.666666666666666,\"pctReduction\":84},{\"id\":\"sod-remediation\",\"name\":\"SoD conflict remediation\",\"desc\":\"Conflict simulation, mitigation control assignment\",\"via\":\"PLATFORM\",\"ticketsPerMonth\":25,\"minManual\":40,\"minSecOps\":10,\"manualHours\":16.666666666666668,\"secOpsHours\":4.166666666666667,\"hoursSaved\":12.5,\"pctReduction\":75},{\"id\":\"dormant-id\",\"name\":\"Dormant / critical ID mgmt\",\"desc\":\"Inactive account deactivation & privileged ID audits\",\"via\":\"PLATFORM\",\"ticketsPerMonth\":15,\"minManual\":30,\"minSecOps\":5,\"manualHours\":7.5,\"secOpsHours\":1.25,\"hoursSaved\":6.25,\"pctReduction\":83},{\"id\":\"ff-access\",\"name\":\"Emergency (FF) access handling\",\"desc\":\"Firefighter elevation, session capture, log review\",\"via\":\"PLATFORM\",\"ticketsPerMonth\":20,\"minManual\":25,\"minSecOps\":3,\"manualHours\":8.333333333333334,\"secOpsHours\":1,\"hoursSaved\":7.333333333333334,\"pctReduction\":88}],\"score\":11,\"maxScore\":24,\"tier\":{\"id\":\"option2\",\"name\":\"Option 2\",\"tag\":\"Platform + Advisory\",\"subtitle\":\"SecOps Platform, with ToggleNow advisory on tap\",\"description\":\"Deploy the SecOps platform to automate routine workflows while retaining ToggleNow\'s senior GRC and SAP security specialists for architectural guidance, rulebook tuning, and audit readiness.\",\"whyFits\":\"Your team possesses solid SAP administration capabilities but is stretched thin across manual checkpoints, periodic reviews, and audit fire drills. SecOps platform automation handles the routine workload, while ToggleNow advisory on tap provides specialized GRC expertise, role redesign assistance, and quarterly audit posture reviews.\",\"features\":[\"Full SecOps Platform deployment & workflow automation\",\"On-demand ToggleNow GRC & SAP Security advisory hours\",\"Accelerated role cleanup and SoD rulebook tuning\",\"Automated periodic recertification and self-service catalog\",\"Executive posture reviews and license true-up strategies\"],\"recommendedFor\":\"Teams with established SAP Basis staff seeking automation and expert backup\",\"readinessCategory\":\"Advisory on Tap\"},\"exposureFlags\":[{\"dim\":\"RESOLUTION SPEED\",\"text\":\"Multi-day access provisioning & resolution handoffs\"},{\"dim\":\"LIFECYCLE MANAGEMENT\",\"text\":\"Manual HR offboarding leaving orphaned SAP accounts active\"},{\"dim\":\"LICENSE RIGHT-SIZING\",\"text\":\"Unoptimized SAP license tier assignments ahead of audits\"}]}', '2026-08-21 11:04:33'),
(3, 8, 'secops', 24, 'option3', 'Platform Only', '[{\"dim\":\"PROVISIONING\",\"question\":\"How are user access requests approved and provisioned today?\",\"answer\":\"Fully automated workflow with role-based, rule-driven provisioning\",\"flag\":null},{\"dim\":\"SOD ANALYSIS\",\"question\":\"When is Segregation of Duties (SoD) analyzed in your access lifecycle?\",\"answer\":\"Preventively simulated in real-time before access is granted\",\"flag\":null},{\"dim\":\"RESOLUTION SPEED\",\"question\":\"On average, how long does it take to resolve an access-related issue or ticket?\",\"answer\":\"Under an hour, with automated routing and instant provisioning\",\"flag\":null},{\"dim\":\"EMERGENCY ACCESS\",\"question\":\"How is emergency, ad-hoc or firefighter access managed?\",\"answer\":\"Self-service elevation with automated workflow, full session replay & audit trails\",\"flag\":null},{\"dim\":\"USER ACCESS REVIEWS\",\"question\":\"How are periodic user access certifications and recertifications conducted?\",\"answer\":\"Automated campaign manager with one-click attestations and auto-deprovisioning\",\"flag\":null},{\"dim\":\"LIFECYCLE MANAGEMENT\",\"question\":\"How are employee role changes and terminations synchronized with SAP access?\",\"answer\":\"Real-time event-driven sync directly from HR / IdM system\",\"flag\":null},{\"dim\":\"LICENSE RIGHT-SIZING\",\"question\":\"How does your organization monitor and optimize SAP user license allocations?\",\"answer\":\"Continuous automated activity profiling with license downgrade recommendations\",\"flag\":null},{\"dim\":\"AUDIT READINESS\",\"question\":\"How much effort is required to prepare evidence for internal and external audits?\",\"answer\":\"Instant, continuous audit-ready reports generated with one click\",\"flag\":null},{\"dim\":\"ROLE GOVERNANCE\",\"question\":\"What is the current health and structure of your SAP authorization role catalog?\",\"answer\":\"Clean, business-aligned single roles with automated impact simulation\",\"flag\":null},{\"dim\":\"LANDSCAPE INTEGRATION\",\"question\":\"How are access controls governed across multiple SAP systems (ECC, S/4, BTP, Cloud)?\",\"answer\":\"Unified cross-system governance plane covering on-premise, cloud, and hybrid\",\"flag\":null},{\"dim\":\"CONTINUOUS MONITORING\",\"question\":\"How do you detect sensitive transaction usage or unauthorized role changes?\",\"answer\":\"Real-time automated alerting on critical t-codes and sensitive parameter changes\",\"flag\":null},{\"dim\":\"TEAM CAPACITY\",\"question\":\"How does your team manage the balance between day-to-day access requests and strategic security projects?\",\"answer\":\"Routine requests are largely automated; team focuses on strategic security posture\",\"flag\":null}]', '2026-08-19 02:30:54', '2026-08-19 02:32:23', NULL, NULL, NULL),
(4, 5, 'secops', 24, 'option3', 'Platform Only', '[{\"dim\":\"PROVISIONING\",\"question\":\"How are user access requests approved and provisioned today?\",\"answer\":\"Fully automated workflow with role-based, rule-driven provisioning\",\"flag\":null},{\"dim\":\"SOD ANALYSIS\",\"question\":\"When is Segregation of Duties (SoD) analyzed in your access lifecycle?\",\"answer\":\"Preventively simulated in real-time before access is granted\",\"flag\":null},{\"dim\":\"RESOLUTION SPEED\",\"question\":\"On average, how long does it take to resolve an access-related issue or ticket?\",\"answer\":\"Under an hour, with automated routing and instant provisioning\",\"flag\":null},{\"dim\":\"EMERGENCY ACCESS\",\"question\":\"How is emergency, ad-hoc or firefighter access managed?\",\"answer\":\"Self-service elevation with automated workflow, full session replay & audit trails\",\"flag\":null},{\"dim\":\"USER ACCESS REVIEWS\",\"question\":\"How are periodic user access certifications and recertifications conducted?\",\"answer\":\"Automated campaign manager with one-click attestations and auto-deprovisioning\",\"flag\":null},{\"dim\":\"LIFECYCLE MANAGEMENT\",\"question\":\"How are employee role changes and terminations synchronized with SAP access?\",\"answer\":\"Real-time event-driven sync directly from HR / IdM system\",\"flag\":null},{\"dim\":\"LICENSE RIGHT-SIZING\",\"question\":\"How does your organization monitor and optimize SAP user license allocations?\",\"answer\":\"Continuous automated activity profiling with license downgrade recommendations\",\"flag\":null},{\"dim\":\"AUDIT READINESS\",\"question\":\"How much effort is required to prepare evidence for internal and external audits?\",\"answer\":\"Instant, continuous audit-ready reports generated with one click\",\"flag\":null},{\"dim\":\"ROLE GOVERNANCE\",\"question\":\"What is the current health and structure of your SAP authorization role catalog?\",\"answer\":\"Clean, business-aligned single roles with automated impact simulation\",\"flag\":null},{\"dim\":\"LANDSCAPE INTEGRATION\",\"question\":\"How are access controls governed across multiple SAP systems (ECC, S/4, BTP, Cloud)?\",\"answer\":\"Unified cross-system governance plane covering on-premise, cloud, and hybrid\",\"flag\":null},{\"dim\":\"CONTINUOUS MONITORING\",\"question\":\"How do you detect sensitive transaction usage or unauthorized role changes?\",\"answer\":\"Real-time automated alerting on critical t-codes and sensitive parameter changes\",\"flag\":null},{\"dim\":\"TEAM CAPACITY\",\"question\":\"How does your team manage the balance between day-to-day access requests and strategic security projects?\",\"answer\":\"Routine requests are largely automated; team focuses on strategic security posture\",\"flag\":null}]', '2026-08-19 12:34:00', '2026-08-20 05:01:39', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invite_product_access_requests`
--

CREATE TABLE `invite_product_access_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `invite_id` int(10) UNSIGNED NOT NULL,
  `product_slug` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `requested_at` timestamp NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invite_product_access_requests`
--

INSERT INTO `invite_product_access_requests` (`id`, `invite_id`, `product_slug`, `status`, `requested_at`, `resolved_at`) VALUES
(1, 2, 'fftrust', 'approved', '2026-08-13 13:14:15', '2026-08-13 13:15:37'),
(2, 9, 'secops', 'approved', '2026-08-21 11:42:29', '2026-09-02 11:06:27');

-- --------------------------------------------------------

--
-- Table structure for table `invite_product_progress`
--

CREATE TABLE `invite_product_progress` (
  `id` int(10) UNSIGNED NOT NULL,
  `invite_id` int(10) UNSIGNED NOT NULL,
  `product_slug` varchar(255) NOT NULL,
  `progress_percent` int(11) NOT NULL DEFAULT 0,
  `progress_steps` text DEFAULT NULL,
  `videos_watched` int(11) NOT NULL DEFAULT 0,
  `videos_total` int(11) NOT NULL DEFAULT 0,
  `admin_notified` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invite_product_progress`
--

INSERT INTO `invite_product_progress` (`id`, `invite_id`, `product_slug`, `progress_percent`, `progress_steps`, `videos_watched`, `videos_total`, `admin_notified`, `updated_at`) VALUES
(1, 1, 'secops', 33, '[\"welcome\",\"stories\"]', 1, 6, 0, '2026-08-14 11:33:12'),
(2, 3, 'secops', 50, '[\"welcome\",\"stories\",\"book\"]', 1, 6, 1, '2026-08-21 11:34:56'),
(3, 5, 'secops', 50, '[\"welcome\",\"stories\",\"book\"]', 1, 6, 1, '2026-08-19 12:39:51'),
(4, 6, 'secops', 50, '[\"welcome\",\"ai\",\"book\"]', 0, 0, 1, '2026-08-14 11:47:07'),
(5, 7, 'digybots', 83, '[\"welcome\",\"why\",\"stories\",\"ai\",\"book\"]', 2, 3, 1, '2026-08-16 11:08:47'),
(6, 5, 'fftrust', 17, '[\"welcome\"]', 0, 0, 0, '2026-08-17 12:45:40'),
(7, 8, 'secops', 33, '[\"welcome\",\"book\"]', 0, 0, 0, '2026-08-19 02:34:29'),
(8, 9, 'fftrust', 33, '[\"welcome\",\"stories\"]', 0, 0, 0, '2026-08-21 11:42:49');

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations`
--

CREATE TABLE `knex_migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `knex_migrations`
--

INSERT INTO `knex_migrations` (`id`, `name`, `batch`, `migration_time`) VALUES
(1, 'migration_01_create_admins.js', 1, '2026-08-13 12:05:04'),
(2, 'migration_02_create_products.js', 1, '2026-08-13 12:05:04'),
(3, 'migration_03_create_capabilities.js', 1, '2026-08-13 12:05:04'),
(4, 'migration_04_create_stories.js', 1, '2026-08-13 12:05:04'),
(5, 'migration_05_create_email_invites.js', 1, '2026-08-13 12:05:04'),
(6, 'migration_06_add_invite_options.js', 1, '2026-08-13 12:05:04'),
(7, 'migration_07_add_security_code.js', 1, '2026-08-13 12:05:04'),
(8, 'migration_08_add_usage_limit.js', 1, '2026-08-13 12:05:04'),
(9, 'migration_09_add_filled_name.js', 1, '2026-08-13 12:05:04'),
(10, 'migration_10_add_product_id_to_capabilities_and_stories.js', 1, '2026-08-13 12:05:04'),
(11, 'migration_11_create_why_features.js', 1, '2026-08-13 12:05:04'),
(12, 'migration_12_create_ai_qa.js', 1, '2026-08-13 12:05:04'),
(13, 'migration_13_create_experience_pages.js', 1, '2026-08-13 12:05:04'),
(14, 'migration_14_add_progress_tracking.js', 1, '2026-08-13 12:05:04'),
(15, 'migration_15_add_video_progress_tracking.js', 1, '2026-08-13 12:05:04'),
(16, 'migration_16_create_bootstrap_state.js', 1, '2026-08-13 12:05:04'),
(17, 'migration_17_add_admin_selected_products.js', 1, '2026-08-13 12:05:04'),
(18, 'migration_18_create_cookie_consents.js', 1, '2026-08-13 12:05:04'),
(19, 'migration_19_add_access_request.js', 1, '2026-08-13 12:05:04'),
(20, 'migration_20_add_usage_limit.js', 1, '2026-08-13 12:05:04'),
(21, 'migration_21_create_invite_product_progress.js', 1, '2026-08-13 12:05:04'),
(22, 'migration_22_create_invite_product_access_requests.js', 1, '2026-08-13 12:05:04'),
(23, 'migration_23_create_product_notify_requests.js', 1, '2026-08-13 12:05:04'),
(24, 'migration_24_create_workshop_requests.js', 1, '2026-08-13 12:05:04'),
(25, 'migration_25_add_image_url_to_capabilities.js', 1, '2026-08-13 12:05:04'),
(26, 'migration_26_add_testimonial_fields_to_stories.js', 2, '2026-08-14 11:30:50'),
(27, 'migration_27_add_download_to_stories.js', 2, '2026-08-14 11:30:50'),
(28, 'migration_28_add_gumlet_id_to_capabilities.js', 3, '2026-08-18 11:19:44'),
(29, 'migration_29_create_invite_assessment_results.js', 4, '2026-08-18 12:12:08'),
(30, 'migration_30_add_roi_to_assessment_results.js', 5, '2026-08-20 12:49:04');

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations_lock`
--

CREATE TABLE `knex_migrations_lock` (
  `index` int(10) UNSIGNED NOT NULL,
  `is_locked` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `knex_migrations_lock`
--

INSERT INTO `knex_migrations_lock` (`index`, `is_locked`) VALUES
(1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `capabilities_tags` text DEFAULT NULL,
  `time` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `cta` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `slug`, `name`, `tagline`, `description`, `capabilities_tags`, `time`, `status`, `cta`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'secops', 'SecOps', 'SAP Security Operations, automated.', 'Automate SAP user provisioning, SoD analysis, license optimization, and emergency access — end to end.', '[\"User Mgmt\",\"SoD\",\"Licenses\",\"Workflow\"]', '12 min', 'available', 'Start Experience', 1, '2026-08-13 13:03:54', '2026-08-13 13:03:54'),
(2, 'fftrust', 'FF Trust', 'Firefighter access with zero blind spots.', 'Session recording, log analytics, and risk scoring for privileged SAP access.', '[\"Firefighter\",\"Log Review\",\"Risk Scoring\"]', '10 min', 'available', 'Start Experience', 2, '2026-08-13 13:03:54', '2026-08-13 13:04:24'),
(3, 'reviewnow', 'ReviewNow', 'Access recertification without the spreadsheets.', 'Automate periodic user access reviews with policy-driven campaigns and audit trails.', '[\"Campaigns\",\"Attestation\",\"Audit\"]', '8 min', 'available', 'Start Experience', 3, '2026-08-13 13:03:54', '2026-08-13 13:04:32'),
(4, 'gams360', 'GAMS360', 'Governance, Access & Monitoring, unified.', 'A single control plane for SAP GRC across systems and landscapes.', '[\"GRC\",\"Monitoring\",\"Analytics\"]', '10 min', 'available', 'Start Experience', 4, '2026-08-13 13:03:54', '2026-08-13 13:04:40'),
(5, 'digybots', 'Digybots', 'Intelligent bots for SAP operations.', 'Automate repetitive SAP Basis and security operations with policy-safe bots.', '[\"Automation\",\"Basis\",\"Ops\"]', '9 min', 'available', 'Start Experience', 5, '2026-08-13 13:03:54', '2026-08-13 13:04:50');

-- --------------------------------------------------------

--
-- Table structure for table `product_notify_requests`
--

CREATE TABLE `product_notify_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_slug` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `requested_at` timestamp NULL DEFAULT current_timestamp(),
  `notified_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stories`
--

CREATE TABLE `stories` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `metric` varchar(255) DEFAULT NULL,
  `challenge` text DEFAULT NULL,
  `solution` text DEFAULT NULL,
  `results` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `product_id` int(10) UNSIGNED DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `person_name` varchar(255) DEFAULT NULL,
  `person_title` varchar(255) DEFAULT NULL,
  `stat1_value` varchar(255) DEFAULT NULL,
  `stat1_label` varchar(255) DEFAULT NULL,
  `stat1_description` varchar(255) DEFAULT NULL,
  `stat2_value` varchar(255) DEFAULT NULL,
  `stat2_label` varchar(255) DEFAULT NULL,
  `stat2_description` varchar(255) DEFAULT NULL,
  `download_url` varchar(255) DEFAULT NULL,
  `download_label` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stories`
--

INSERT INTO `stories` (`id`, `slug`, `industry`, `company`, `metric`, `challenge`, `solution`, `results`, `sort_order`, `created_at`, `updated_at`, `product_id`, `photo_url`, `person_name`, `person_title`, `stat1_value`, `stat1_label`, `stat1_description`, `stat2_value`, `stat2_label`, `stat2_description`, `download_url`, `download_label`) VALUES
(6, 'secops-global-retailer', 'Retail', 'A global multi-brand retailer', '68% faster provisioning', 'New-store rollouts required manual SAP access setup that took up to 5 days per employee, delaying store openings.', 'Deployed SecOps to automate joiner-mover-leaver provisioning tied directly to HR onboarding events.', 'Provisioning time dropped to under 8 hours on average, with zero SoD violations introduced during the rollout.', 0, '2026-08-14 11:32:00', '2026-08-14 11:33:09', 1, '/uploads/images/1786707166435-91d2c13dad11797e.png', 'Priya Anand', 'Global Industrial Group — Director of Enterprise SAP Systems', '68%', 'Faster Provisioning', 'New-store access setup time, before vs. after rollout', '8 hrs', 'Avg. Turnaround', 'Down from up to 5 days per employee', '/uploads/documents/1786707184726-28fb8dc631b23293.pdf', ''),
(7, 'fftrust-manufacturing-group', 'Manufacturing', 'A multinational manufacturing group', '90% faster session review', 'Firefighter access reviews were done manually from raw logs, taking auditors 3+ weeks per quarterly cycle.', 'Rolled out FF Trust for automatic session capture and reviewer routing across all plants.', 'Review turnaround dropped to under 2 days, with a complete tamper-evident audit trail for every session.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 2, NULL, 'Daniel Okafor', 'Multinational Manufacturing Group — Head of IT Risk & Compliance', '90%', 'Faster Session Review', 'Auditor review turnaround across all plants', '<2 days', 'Review Turnaround', 'Down from 3+ weeks per quarterly cycle', NULL, NULL),
(8, 'reviewnow-financial-services', 'Financial Services', 'A regional financial services firm', '100% on-time campaigns', 'Quarterly UAR campaigns were tracked in spreadsheets and routinely missed audit deadlines.', 'Implemented ReviewNow with automated reminders and manager escalation for overdue reviews.', 'Every campaign since rollout has completed on schedule, with full sign-off evidence ready for auditors.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 3, NULL, 'Laura Simmons', 'Regional Financial Services Firm — VP, Internal Audit', '100%', 'On-Time Campaigns', 'Every UAR campaign completed on schedule since rollout', '0', 'Missed Deadlines', 'Down from routine spreadsheet-tracked misses', NULL, NULL),
(9, 'gams360-energy-conglomerate', 'Energy', 'A multi-entity energy conglomerate', '4 tools into 1 dashboard', 'Governance was split across four disconnected tools with no unified risk view for leadership.', 'Consolidated onto GAMS360 as a single control plane across all SAP instances.', 'Leadership now gets one weighted risk score and one compliance dashboard across the entire landscape.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 4, NULL, 'Rajiv Mehta', 'Multi-Entity Energy Conglomerate — CISO', '4→1', 'Tools Consolidated', 'Four disconnected governance tools into one dashboard', '1', 'Unified Risk Score', 'Single weighted score across the entire SAP landscape', NULL, NULL),
(10, 'digybots-logistics-provider', 'Logistics', 'A national logistics provider', '12 hrs/week reclaimed per admin', 'Basis admins spent a third of their week on manual transport releases and client refreshes.', 'Automated recurring Basis tasks with Digybots\' pre-built bot templates.', 'Basis team reclaimed roughly 12 hours per admin per week, redirected to higher-value platform work.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00', 5, NULL, 'Emily Carter', 'National Logistics Provider — SAP Basis Team Lead', '12 hrs', 'Reclaimed / Week', 'Per Basis admin, redirected to higher-value work', '33%', 'Less Manual Work', 'Of weekly time previously spent on transports & refreshes', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `why_features`
--

CREATE TABLE `why_features` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `icon` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `why_features`
--

INSERT INTO `why_features` (`id`, `product_id`, `icon`, `title`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
(21, 1, 'Zap', '70% Faster Provisioning', 'Cut new-hire and role-change turnaround from days to hours with automated approval routing.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(22, 1, 'ShieldCheck', 'Built-in SoD Checks', 'Every request is screened against your SoD rules before it\'s ever approved.', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(23, 1, 'CreditCard', 'Reclaim License Spend', 'Continuous license-type mapping typically recovers 15-30% in SAP license cost.', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(24, 1, 'Timer', 'Instant Emergency Access', 'Time-boxed firefighter access granted in seconds, auto-revoked at expiry.', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(25, 2, 'ShieldCheck', 'Full Session Visibility', 'Keystroke-level logging of every privileged session, automatically.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(26, 2, 'Timer', 'Time-Boxed Access', 'Firefighter IDs are force-revoked the moment the access window closes.', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(27, 2, 'CheckCircle', 'Faster Review Cycles', 'Session logs route to reviewers automatically, cutting review lag from weeks to days.', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(28, 2, 'TrendingUp', 'Audit-Ready Evidence', 'Tamper-evident trails exportable directly for SOX and internal audit.', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(29, 3, 'Users', 'Automated Campaigns', 'Scheduling, reminders, and evidence capture for every recertification cycle.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(30, 3, 'Timer', 'Configurable Escalation', 'Overdue reviews auto-escalate to managers so campaigns never stall.', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(31, 3, 'CheckCircle', 'Auto-Revoke on Reject', 'Access rejected in review is deprovisioned in SAP without a separate ticket.', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(32, 3, 'ShieldCheck', 'Audit-Ready Reports', 'Full sign-off history per user, reviewer, and role for every campaign.', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(33, 4, 'Zap', 'One Control Plane', 'Provisioning, SoD, firefighter monitoring, and reviews in a single dashboard.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(34, 4, 'TrendingUp', 'Unified Risk Scoring', 'One weighted risk score per user across every governance signal you track.', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(35, 4, 'Users', 'Executive Visibility', 'A single dashboard leadership can actually read, across your whole SAP landscape.', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(36, 4, 'ShieldCheck', 'Scales Across Systems', 'Aggregates governance across multiple SAP instances as you grow.', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(37, 5, 'Zap', 'No-Code Automation', 'Pre-built bot templates for refreshes, client copies, and transports — no scripting.', 0, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(38, 5, 'Timer', '10-15 Hrs/Week Saved', 'Reclaim significant Basis admin time from recurring maintenance work.', 1, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(39, 5, 'CheckCircle', 'Unattended Scheduling', 'Chain and schedule jobs overnight with automatic failure alerts.', 2, '2026-08-14 11:32:00', '2026-08-14 11:32:00'),
(40, 5, 'ShieldCheck', 'Approval-Gated Transports', 'Automated transport handling still respects your existing approval gates.', 3, '2026-08-14 11:32:00', '2026-08-14 11:32:00');

-- --------------------------------------------------------

--
-- Table structure for table `workshop_requests`
--

CREATE TABLE `workshop_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `invite_id` int(10) UNSIGNED NOT NULL,
  `product_slug` varchar(255) NOT NULL,
  `interests` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workshop_requests`
--

INSERT INTO `workshop_requests` (`id`, `invite_id`, `product_slug`, `interests`, `notes`, `created_at`) VALUES
(1, 1, 'secops', '[\"secops\"]', NULL, '2026-08-13 13:05:33'),
(2, 1, 'secops', '[\"secops\"]', NULL, '2026-08-13 13:11:16'),
(3, 1, 'secops', '[\"secops\"]', NULL, '2026-08-13 13:11:45'),
(4, 3, 'secops', '[\"secops\"]', NULL, '2026-08-13 13:18:54'),
(5, 6, 'secops', '[\"secops\",\"fftrust\"]', NULL, '2026-08-14 11:46:48'),
(6, 7, 'digybots', '[\"digybots\"]', NULL, '2026-08-16 11:08:44'),
(7, 3, 'secops', '[\"secops\"]', NULL, '2026-08-17 06:44:26'),
(8, 5, 'secops', '[\"secops\"]', NULL, '2026-08-17 12:54:37'),
(9, 3, 'secops', '[\"secops\"]', NULL, '2026-08-18 12:23:06'),
(10, 3, 'secops', '[\"secops\"]', NULL, '2026-08-18 13:13:53'),
(11, 8, 'secops', '[\"secops\"]', NULL, '2026-08-19 02:34:17'),
(12, 5, 'secops', '[\"secops\"]', NULL, '2026-08-19 12:38:33'),
(13, 3, 'secops', '[\"secops\"]', 'hgfd', '2026-08-21 11:08:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admins_email_unique` (`email`);

--
-- Indexes for table `ai_qa`
--
ALTER TABLE `ai_qa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ai_qa_product_id_foreign` (`product_id`);

--
-- Indexes for table `bootstrap_state`
--
ALTER TABLE `bootstrap_state`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `capabilities`
--
ALTER TABLE `capabilities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `capabilities_slug_unique` (`slug`),
  ADD KEY `capabilities_product_id_foreign` (`product_id`);

--
-- Indexes for table `cookie_consents`
--
ALTER TABLE `cookie_consents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cookie_consents_device_id_index` (`device_id`);

--
-- Indexes for table `email_invites`
--
ALTER TABLE `email_invites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_invites_token_hash_unique` (`token_hash`);

--
-- Indexes for table `experience_pages`
--
ALTER TABLE `experience_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `experience_pages_product_id_page_unique` (`product_id`,`page`);

--
-- Indexes for table `invite_assessment_results`
--
ALTER TABLE `invite_assessment_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invite_assessment_results_invite_id_product_slug_unique` (`invite_id`,`product_slug`);

--
-- Indexes for table `invite_product_access_requests`
--
ALTER TABLE `invite_product_access_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invite_product_access_requests_invite_id_product_slug_unique` (`invite_id`,`product_slug`);

--
-- Indexes for table `invite_product_progress`
--
ALTER TABLE `invite_product_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invite_product_progress_invite_id_product_slug_unique` (`invite_id`,`product_slug`);

--
-- Indexes for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  ADD PRIMARY KEY (`index`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_slug_unique` (`slug`);

--
-- Indexes for table `product_notify_requests`
--
ALTER TABLE `product_notify_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_notify_requests_product_slug_email_unique` (`product_slug`,`email`);

--
-- Indexes for table `stories`
--
ALTER TABLE `stories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stories_slug_unique` (`slug`),
  ADD KEY `stories_product_id_foreign` (`product_id`);

--
-- Indexes for table `why_features`
--
ALTER TABLE `why_features`
  ADD PRIMARY KEY (`id`),
  ADD KEY `why_features_product_id_foreign` (`product_id`);

--
-- Indexes for table `workshop_requests`
--
ALTER TABLE `workshop_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `workshop_requests_invite_id_foreign` (`invite_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ai_qa`
--
ALTER TABLE `ai_qa`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `bootstrap_state`
--
ALTER TABLE `bootstrap_state`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `capabilities`
--
ALTER TABLE `capabilities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `cookie_consents`
--
ALTER TABLE `cookie_consents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `email_invites`
--
ALTER TABLE `email_invites`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `experience_pages`
--
ALTER TABLE `experience_pages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `invite_assessment_results`
--
ALTER TABLE `invite_assessment_results`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `invite_product_access_requests`
--
ALTER TABLE `invite_product_access_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `invite_product_progress`
--
ALTER TABLE `invite_product_progress`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  MODIFY `index` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `product_notify_requests`
--
ALTER TABLE `product_notify_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stories`
--
ALTER TABLE `stories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `why_features`
--
ALTER TABLE `why_features`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `workshop_requests`
--
ALTER TABLE `workshop_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ai_qa`
--
ALTER TABLE `ai_qa`
  ADD CONSTRAINT `ai_qa_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `capabilities`
--
ALTER TABLE `capabilities`
  ADD CONSTRAINT `capabilities_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `experience_pages`
--
ALTER TABLE `experience_pages`
  ADD CONSTRAINT `experience_pages_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `invite_assessment_results`
--
ALTER TABLE `invite_assessment_results`
  ADD CONSTRAINT `invite_assessment_results_invite_id_foreign` FOREIGN KEY (`invite_id`) REFERENCES `email_invites` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invite_product_access_requests`
--
ALTER TABLE `invite_product_access_requests`
  ADD CONSTRAINT `invite_product_access_requests_invite_id_foreign` FOREIGN KEY (`invite_id`) REFERENCES `email_invites` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invite_product_progress`
--
ALTER TABLE `invite_product_progress`
  ADD CONSTRAINT `invite_product_progress_invite_id_foreign` FOREIGN KEY (`invite_id`) REFERENCES `email_invites` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stories`
--
ALTER TABLE `stories`
  ADD CONSTRAINT `stories_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `why_features`
--
ALTER TABLE `why_features`
  ADD CONSTRAINT `why_features_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `workshop_requests`
--
ALTER TABLE `workshop_requests`
  ADD CONSTRAINT `workshop_requests_invite_id_foreign` FOREIGN KEY (`invite_id`) REFERENCES `email_invites` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
