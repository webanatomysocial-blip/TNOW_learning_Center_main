exports.up = async function (knex) {
  await knex.schema.createTable("ai_qa", (table) => {
    table.increments("id").primary();
    table.integer("product_id").unsigned().notNullable().references("id").inTable("products");
    table.string("question").notNullable();
    table.text("answer");
    table.string("topic").nullable();
    table.integer("sort_order").defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  const secops = await knex("products").where({ slug: "secops" }).first();
  if (secops) {
    const QA = [
      {
        q: "What is the typical ROI timeline?",
        topic: "Business Value",
        a: "Most enterprises achieve full payback in 4 to 6 months. Savings are driven by immediate SAP license optimization (typically 15-30% spend reduction), 50%+ reduction in IT helpdesk ticket volume, and eliminating audit-prep manual fire drills.",
      },
      {
        q: "How does this fit our compliance and audit cycle?",
        topic: "Compliance",
        a: "SecOps is built for continuous compliance. It replaces manual periodic fire drills with real-time Segregation of Duties (SoD) checking and auto-generates audit evidence on demand. It turns compliance into a frictionless background process.",
      },
      {
        q: "What does implementation require from our team?",
        topic: "Implementation",
        a: "Very little. SecOps connects via secure, standard SAP RFCs without any ABAP custom code. It requires about 2-3 hours of an SAP Basis administrator's time for configuration, and a security analyst to review the out-of-the-box rulesets.",
      },
      {
        q: "How is licensing priced?",
        topic: "Commercial",
        a: "Licensing is per named SAP user, tiered by module. Typical enterprises see 3–5x ROI in year one through license optimization alone.",
      },
      {
        q: "Does SecOps support SAP ECC?",
        topic: "Compatibility",
        a: "Yes — SecOps supports SAP ECC 6.0 EhP7 and above via a certified RFC connector. Existing PFCG roles, user master data, and SUIM extracts continue to work without change.",
      },
      {
        q: "Does SecOps support S/4HANA?",
        topic: "Compatibility",
        a: "Yes. SecOps is certified for S/4HANA on-premise and RISE/GROW deployments, including Fiori catalog-based authorization and business role composition.",
      },
      {
        q: "Is there a cloud deployment option?",
        topic: "Deployment",
        a: "SecOps runs on-premise, on your private cloud (AWS, Azure, GCP), or fully managed by ToggleNow. All deployment modes share the same feature set.",
      },
      {
        q: "What does the architecture look like?",
        topic: "Architecture",
        a: "A stateless application tier (Java + React) communicates with SAP via secure RFC. Data is stored in your database of choice (HANA, Postgres, Oracle). Zero footprint inside SAP.",
      },
      {
        q: "How do you handle migration from SAP GRC?",
        topic: "Migration",
        a: "We provide a GRC accelerator that imports rulesets, mitigating controls, and role definitions, cutting migration effort by 60%.",
      },
    ];
    await knex("ai_qa").insert(
      QA.map((item, idx) => ({
        product_id: secops.id,
        question: item.q,
        answer: item.a,
        topic: item.topic,
        sort_order: idx,
      })),
    );
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("ai_qa");
};
