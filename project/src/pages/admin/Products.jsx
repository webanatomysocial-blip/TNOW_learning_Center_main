import { useDocumentHead } from "@/lib/use-document-head";
import { ResourceManager } from "@/components/admin/ResourceManager";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "slug", label: "Slug" },
  { key: "status", label: "Status" },
  { key: "sort_order", label: "Sort" },
];

const FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "slug", label: "Slug", type: "text" },
  { key: "tagline", label: "Tagline", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "capabilities_tags", label: "Capability tags (comma separated)", type: "list" },
  { key: "time", label: "Time (e.g. 12 min)", type: "text" },
  { key: "status", label: "Status (available / coming)", type: "text" },
  { key: "cta", label: "CTA label", type: "text" },
  { key: "sort_order", label: "Sort order", type: "number" },
];

const EMPTY = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  capabilities_tags: [],
  time: "",
  status: "coming",
  cta: "",
  sort_order: 1,
};

export function AdminProductsPage() {
  useDocumentHead({ meta: [{ title: "Products — Admin" }] });
  return (
    <ResourceManager
      resource="products"
      title="Products"
      columns={COLUMNS}
      fields={FIELDS}
      emptyItem={EMPTY}
      rowLinkTo={(item) => `/admin/products/${item.id}`}
    />
  );
}
