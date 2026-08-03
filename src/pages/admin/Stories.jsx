import { ResourceManager } from "@/components/admin/ResourceManager";

const COLUMNS = [
  { key: "company", label: "Company" },
  { key: "product_name", label: "Product" },
  { key: "slug", label: "Slug" },
  { key: "industry", label: "Industry" },
  { key: "metric", label: "Metric" },
  { key: "sort_order", label: "Sort" },
];

const FIELDS = [
  { key: "product_slug", label: "Product", type: "product" },
  { key: "company", label: "Company", type: "text" },
  { key: "slug", label: "Slug", type: "text" },
  {
    key: "industry",
    label: "Industry",
    type: "select",
    options: ["Manufacturing", "Pharma", "Banking", "Utilities", "Retail", "Healthcare", "Logistics", "Services", "Other"],
  },
  { key: "metric", label: "Metric (e.g. 62% ticket reduction)", type: "text" },
  { key: "challenge", label: "Challenge", type: "textarea" },
  { key: "solution", label: "Solution", type: "textarea" },
  { key: "results", label: "Results", type: "textarea" },
  { key: "sort_order", label: "Sort order", type: "number" },
];

const EMPTY = {
  product_slug: "",
  company: "",
  slug: "",
  industry: "",
  metric: "",
  challenge: "",
  solution: "",
  results: "",
  sort_order: 1,
};

// Used as a tab inside a product's detail page (`productSlug` scopes the list and hides
// the Product picker).
export function StoriesTab({ productSlug }) {
  return (
    <ResourceManager
      resource="stories"
      title="Stories"
      columns={COLUMNS}
      fields={FIELDS}
      emptyItem={EMPTY}
      productSlug={productSlug}
    />
  );
}
