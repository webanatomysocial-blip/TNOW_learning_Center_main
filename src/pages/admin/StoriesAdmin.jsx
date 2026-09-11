import { ResourceManager } from "@/components/admin/ResourceManager";
import { useDocumentHead } from "@/lib/use-document-head";
import { COLUMNS, FIELDS, EMPTY } from "@/pages/admin/Stories";

// Standalone top-level page — manage customer stories across every product in
// one place, instead of having to open each product's detail page and switch
// to its Customer Stories tab. No `productSlug` scoping, so the Product
// column/picker (hidden inside the per-product tab) shows here.
export function StoriesAdminPage() {
  useDocumentHead({ meta: [{ title: "Customer Stories — Admin" }] });
  return (
    <ResourceManager
      resource="stories"
      title="Customer Stories"
      columns={COLUMNS}
      fields={FIELDS}
      emptyItem={EMPTY}
      rowLinkTo={(item) => `/admin/stories/${item.id}`}
      newLinkTo="/admin/stories/new"
    />
  );
}
