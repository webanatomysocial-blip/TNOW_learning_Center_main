import { ResourceManager } from "@/components/admin/ResourceManager";

export const COLUMNS = [
  { key: "company", label: "Company" },
  { key: "product_name", label: "Product" },
  { key: "slug", label: "Slug" },
  { key: "industry", label: "Industry" },
  { key: "metric", label: "Metric" },
  { key: "sort_order", label: "Sort" },
];

export const FIELDS = [
  { key: "product_slug", label: "Product", type: "product" },
  { key: "company", label: "Company", type: "text" },
  { key: "slug", label: "Slug", type: "text" },
  {
    key: "industry",
    label: "Industry",
    type: "select",
    options: ["Manufacturing", "Pharma", "Banking", "Utilities", "Retail", "Healthcare", "Logistics", "Services", "Other"],
  },
  { key: "metric", label: "Metric badge (e.g. 62% ticket reduction)", type: "text" },
  {
    key: "photo_url",
    label: "Card & Quote Photo",
    type: "image",
    helperText: "Shown as the story card thumbnail and next to the quote in the popup.",
  },
  { key: "challenge", label: "Challenge", type: "textarea" },
  { key: "solution", label: "Solution", type: "textarea" },
  { key: "results", label: "Results", type: "textarea" },
  {
    key: "person_name",
    label: "Quoted person's name",
    type: "text",
    helperText: "e.g. Marcus Vance. Leave blank to hide the quote block in the popup.",
  },
  { key: "person_title", label: "Quoted person's title", type: "text", helperText: "e.g. Global Industrial Group — Director of Enterprise SAP Systems" },
  { key: "stat1_value", label: "Stat tile 1 — value", type: "text", helperText: "e.g. 62%" },
  { key: "stat1_label", label: "Stat tile 1 — label", type: "text", helperText: "e.g. Ticket Reduction" },
  { key: "stat1_description", label: "Stat tile 1 — description", type: "text", helperText: "e.g. L1 helpdesk volume dropped in 6 months" },
  { key: "stat2_value", label: "Stat tile 2 — value", type: "text", helperText: "e.g. 12min" },
  { key: "stat2_label", label: "Stat tile 2 — label", type: "text", helperText: "e.g. Provisioning Speed" },
  { key: "stat2_description", label: "Stat tile 2 — description", type: "text", helperText: "e.g. Down from 4-6 days per user request" },
  {
    key: "download_url",
    label: "Downloadable PDF",
    type: "file",
    helperText: "Case study or one-pager. Leave blank to hide the download button in the popup.",
  },
  { key: "download_label", label: "Download button text", type: "text", helperText: "e.g. Download PDF, Read Case Study" },
  { key: "sort_order", label: "Sort order", type: "number" },
];

export const EMPTY = {
  product_slug: "",
  company: "",
  slug: "",
  industry: "",
  metric: "",
  photo_url: "",
  challenge: "",
  solution: "",
  results: "",
  person_name: "",
  person_title: "",
  stat1_value: "",
  stat1_label: "",
  stat1_description: "",
  stat2_value: "",
  stat2_label: "",
  stat2_description: "",
  download_url: "",
  download_label: "Download PDF",
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
      rowLinkTo={(item) => `/admin/stories/${item.id}`}
      newLinkTo={`/admin/stories/new?product=${productSlug}`}
    />
  );
}
