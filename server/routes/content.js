const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Resource configuration: table name, JSON array columns, and required fields on create.
const RESOURCES = {
  products: {
    table: "products",
    jsonFields: ["capabilities_tags"],
    required: ["slug", "name"],
  },
  capabilities: {
    table: "capabilities",
    jsonFields: ["features"],
    required: ["slug", "title"],
    productScoped: true,
  },
  stories: {
    table: "stories",
    jsonFields: [], // stories has no JSON array fields
    required: ["slug", "company"],
    productScoped: true,
  },
  "why-features": {
    table: "why_features",
    jsonFields: [],
    required: ["icon", "title"],
    productScoped: true,
    productRequiredOnQuery: true,
  },
  "ai-qa": {
    table: "ai_qa",
    jsonFields: [],
    required: ["question"],
    productScoped: true,
    productRequiredOnQuery: true,
  },
};

async function resolveProductId(slug) {
  if (!slug) return null;
  const product = await db("products").where({ slug }).first();
  return product ? product.id : undefined; // undefined = not found
}

function parseRecord(record, jsonFields) {
  if (!record) return record;
  const parsed = { ...record };
  for (const field of jsonFields) {
    if (typeof parsed[field] === "string") {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch {
        parsed[field] = [];
      }
    }
  }
  return parsed;
}

function stringifyPayload(payload, jsonFields) {
  const out = { ...payload };
  for (const field of jsonFields) {
    if (field in out && Array.isArray(out[field])) {
      out[field] = JSON.stringify(out[field]);
    }
  }
  return out;
}

function registerResource(name, config) {
  const { table, jsonFields, required, productScoped, productRequiredOnQuery } = config;

  // Public: list
  router.get(`/api/${name}`, async (req, res) => {
    try {
      const productSlug = req.query.product;

      if (productScoped && productRequiredOnQuery && !productSlug) {
        return res.status(400).json({ message: "Missing required query param: product" });
      }

      let query = db(table).orderBy("sort_order", "asc");

      if (productScoped && productSlug) {
        const productId = await resolveProductId(productSlug);
        if (!productId) return res.json([]);
        query = query.where({ product_id: productId });
      }

      if (name === "capabilities" || name === "stories") {
        // Include product slug/name for admin table display.
        const rows = await query.select(`${table}.*`);
        const productIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))];
        const products = productIds.length
          ? await db("products").whereIn("id", productIds)
          : [];
        const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
        return res.json(
          rows.map((r) => ({
            ...parseRecord(r, jsonFields),
            product_slug: productsById[r.product_id]?.slug ?? null,
            product_name: productsById[r.product_id]?.name ?? null,
          })),
        );
      }

      const rows = await query;
      res.json(rows.map((r) => parseRecord(r, jsonFields)));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to fetch ${name}` });
    }
  });

  // Public: single
  router.get(`/api/${name}/:id`, async (req, res) => {
    try {
      const row = await db(table).where({ id: req.params.id }).first();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(parseRecord(row, jsonFields));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to fetch ${name.slice(0, -1)}` });
    }
  });

  // Protected: create
  router.post(`/api/admin/${name}`, requireAdmin, async (req, res) => {
    const payload = { ...(req.body || {}) };
    const productSlug = payload.product_slug;
    delete payload.product_slug;

    const missing = required.filter((field) => !payload[field]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    if (productScoped) {
      if (!productSlug) {
        return res.status(400).json({ message: "Missing required field: product_slug" });
      }
      const productId = await resolveProductId(productSlug);
      if (!productId) {
        return res.status(400).json({ message: `Unknown product slug: ${productSlug}` });
      }
      payload.product_id = productId;
    }

    try {
      const toInsert = stringifyPayload(payload, jsonFields);
      delete toInsert.id;
      toInsert.updated_at = new Date();
      const [id] = await db(table).insert(toInsert);
      const created = await db(table)
        .where({ id: id ?? toInsert.id })
        .first();
      res.status(201).json(parseRecord(created, jsonFields));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to create ${name.slice(0, -1)}` });
    }
  });

  // Protected: update
  router.put(`/api/admin/${name}/:id`, requireAdmin, async (req, res) => {
    try {
      const existing = await db(table).where({ id: req.params.id }).first();
      if (!existing) return res.status(404).json({ message: "Not found" });

      const payload = { ...(req.body || {}) };
      const productSlug = payload.product_slug;
      delete payload.product_slug;

      if (productScoped && productSlug) {
        const productId = await resolveProductId(productSlug);
        if (!productId) {
          return res.status(400).json({ message: `Unknown product slug: ${productSlug}` });
        }
        payload.product_id = productId;
      }

      const stringified = stringifyPayload(payload, jsonFields);
      delete stringified.id;
      stringified.updated_at = new Date();

      await db(table).where({ id: req.params.id }).update(stringified);
      const updated = await db(table).where({ id: req.params.id }).first();
      res.json(parseRecord(updated, jsonFields));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to update ${name.slice(0, -1)}` });
    }
  });

  // Protected: delete
  router.delete(`/api/admin/${name}/:id`, requireAdmin, async (req, res) => {
    try {
      const count = await db(table).where({ id: req.params.id }).del();
      if (!count) return res.status(404).json({ message: "Not found" });
      res.status(204).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to delete ${name.slice(0, -1)}` });
    }
  });
}

for (const [name, config] of Object.entries(RESOURCES)) {
  registerResource(name, config);
}

// Singleton per-product-per-page content (experience_pages): why / ai / book headers.
const EXPERIENCE_PAGE_TYPES = ["why", "ai", "book"];

router.get("/api/experience-pages", async (req, res) => {
  try {
    const { product: productSlug, page } = req.query;
    if (!productSlug || !EXPERIENCE_PAGE_TYPES.includes(page)) {
      return res.status(400).json({ message: "Missing or invalid product/page query params" });
    }
    const productId = await resolveProductId(productSlug);
    if (!productId) {
      return res.json({ headline: "", description: "", extra: {} });
    }
    const row = await db("experience_pages").where({ product_id: productId, page }).first();
    if (!row) {
      return res.json({ headline: "", description: "", extra: {} });
    }
    let extra = {};
    try {
      extra = row.extra ? JSON.parse(row.extra) : {};
    } catch {
      extra = {};
    }
    res.json({ headline: row.headline, description: row.description, extra });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch experience page" });
  }
});

router.put("/api/admin/experience-pages", requireAdmin, async (req, res) => {
  try {
    const { product: productSlug, page } = req.query;
    if (!productSlug || !EXPERIENCE_PAGE_TYPES.includes(page)) {
      return res.status(400).json({ message: "Missing or invalid product/page query params" });
    }
    const productId = await resolveProductId(productSlug);
    if (!productId) {
      return res.status(400).json({ message: `Unknown product slug: ${productSlug}` });
    }

    const { headline, description, extra } = req.body || {};
    const payload = {
      product_id: productId,
      page,
      headline: headline ?? "",
      description: description ?? "",
      extra: JSON.stringify(extra ?? {}),
      updated_at: new Date(),
    };

    const existing = await db("experience_pages").where({ product_id: productId, page }).first();
    if (existing) {
      await db("experience_pages").where({ id: existing.id }).update(payload);
    } else {
      await db("experience_pages").insert(payload);
    }
    const row = await db("experience_pages").where({ product_id: productId, page }).first();
    let parsedExtra = {};
    try {
      parsedExtra = row.extra ? JSON.parse(row.extra) : {};
    } catch {
      parsedExtra = {};
    }
    res.json({ headline: row.headline, description: row.description, extra: parsedExtra });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save experience page" });
  }
});

module.exports = router;
