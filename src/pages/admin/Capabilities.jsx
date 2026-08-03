import { ResourceManager } from "@/components/admin/ResourceManager";

const COLUMNS = [
  { key: "title", label: "Title" },
  { key: "product_name", label: "Product" },
  { key: "slug", label: "Slug" },
  { key: "duration", label: "Duration" },
  { key: "sort_order", label: "Sort" },
];

const FIELDS = [
  { key: "product_slug", label: "Product", type: "product" },
  { key: "title", label: "Title", type: "text" },
  { key: "slug", label: "Slug", type: "text" },
  { key: "duration", label: "Duration (e.g. 2:14)", type: "text" },
  { key: "summary", label: "Summary", type: "textarea" },
  { key: "features", label: "Features (comma or newline separated)", type: "list" },
  { key: "value", label: "Business value", type: "textarea" },
  {
    key: "video_url",
    label: "Video URL",
    type: "text",
    helperText: "YouTube, Vimeo, Gumlet, or a direct .mp4/.webm link all work.",
  },
  { key: "sort_order", label: "Sort order", type: "number" },
];

const EMPTY = {
  product_slug: "",
  title: "",
  slug: "",
  duration: "",
  summary: "",
  features: [],
  value: "",
  video_url: "",
  sort_order: 1,
};

// Used as a tab inside a product's detail page (`productSlug` provided — scopes the list
// and hides the Product picker) as well as directly reachable at nothing anymore, kept
// exported in case a future global "all capabilities" view is wanted again.
export function CapabilitiesTab({ productSlug }) {
  return (
    <ResourceManager
      resource="capabilities"
      title="Capabilities"
      columns={COLUMNS}
      fields={FIELDS}
      emptyItem={EMPTY}
      productSlug={productSlug}
    />
  );
}
