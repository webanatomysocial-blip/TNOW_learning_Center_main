import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Inbox, Pencil, Plus, Trash2, X, Search } from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { ResourceFormFields } from "@/components/admin/ResourceFormFields";
import { useFileUpload } from "@/lib/use-file-upload";

// Naive english singularization for a plural `title` label (e.g. "Products" → "Product",
// "Capabilities" → "Capability", "Stories" → "Story"). Good enough for the CMS resource
// names this component is actually used with — not a general-purpose inflector.
function singularize(title) {
  if (title.endsWith("ies")) return `${title.slice(0, -3)}y`;
  return title.replace(/s$/, "");
}

// Generic admin CRUD manager for a single CMS resource (products / capabilities / stories).
//
// `resource` — the API resource name, e.g. "products" (hits /api/products, /api/admin/products).
// `title` — human label shown in headings, e.g. "Products".
// `columns` — [{ key, label }] shown in the table.
// `fields` — [{ key, label, type: "text" | "textarea" | "list" | "number", listSeparator? }]
//   "list" fields are edited as a text input/textarea and converted to/from a JSON array on
//   save/load using listSeparator (defaults to comma-or-newline).
// `emptyItem` — default form values for "New" dialog.
// `listPath` — optional override for the GET list path (defaults to `/api/${resource}`),
//   e.g. to scope by product: `/api/why-features?product=secops`.
// `extraSubmitFields` — optional object merged into the create/update body but not
//   rendered as a visible form field (e.g. { product_slug: "secops" }).
// `productSlug` — when set, scopes the list to that product automatically (implies
//   `listPath`), hides any `type: "product"` field/column since it's already known, and
//   merges `product_slug` into every create/update body. Used when this manager is embedded
//   inside a product's detail page instead of shown as a standalone, unscoped admin page.
// `rowLinkTo` — optional `(item) => href`. When set, each row shows a "Manage" link to that
//   href instead of an inline "Edit" button — for resources (like Products) whose full edit
//   experience lives on its own detail page rather than a quick modal.
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

export function ResourceManager({
  resource,
  title,
  columns,
  fields,
  emptyItem,
  listPath,
  extraSubmitFields,
  productSlug,
  rowLinkTo,
  newLinkTo,
}) {
  const token = useAdminStore((s) => s.token);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveFields = productSlug ? fields.filter((f) => f.type !== "product") : fields;
  const effectiveColumns = productSlug
    ? columns.filter((c) => c.key !== "product_name" && c.key !== "product_slug")
    : columns;
  const effectiveEmptyItem = productSlug ? { ...emptyItem, product_slug: productSlug } : emptyItem;
  const effectiveListPath =
    listPath ?? (productSlug ? `/api/${resource}?product=${productSlug}` : `/api/${resource}`);
  const mergedExtraSubmitFields = productSlug
    ? { ...(extraSubmitFields || {}), product_slug: productSlug }
    : extraSubmitFields;

  const [form, setForm] = useState(effectiveEmptyItem);
  const { uploadingKey, uploadError, handleFileUpload: uploadFile } = useFileUpload(token);

  const { data, isLoading, isError, refetch } = useApiGet(effectiveListPath);
  const items = data ?? [];
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return Object.values(item).some(
      (val) => typeof val === "string" && val.toLowerCase().includes(query)
    );
  });

  function handleFileUpload(key, file, kind) {
    uploadFile(key, file, kind, handleFieldChange);
  }

  function handleFieldChange(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (["name", "title", "company"].includes(key) && "slug" in prev) {
        const currentSlug = prev.slug || "";
        const slugifiedPrev = slugify(prev[key] || "");
        if (!currentSlug || currentSlug === slugifiedPrev) {
          next.slug = slugify(value);
        }
      }
      return next;
    });
  }

  const hasProductField = effectiveFields.some((f) => f.type === "product");
  const { data: productsData } = useApiGet(hasProductField ? "/api/products" : null, {
    enabled: hasProductField,
  });
  const products = productsData ?? [];

  function openCreate() {
    setEditing(null);
    setForm(toFormValues(effectiveEmptyItem, effectiveFields));
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm(toFormValues(item, effectiveFields));
    setFormError("");
    setDialogOpen(true);
  }

  useEffect(() => {
    if (!dialogOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setDialogOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen]);

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name || item.title || item.company || item.slug}"?`)) {
      return;
    }
    await apiSend(`/api/admin/${resource}/${item.id}`, "DELETE", undefined, token);
    refetch();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    const body = { ...fromFormValues(form, effectiveFields), ...(mergedExtraSubmitFields || {}) };
    try {
      if (editing) {
        await apiSend(`/api/admin/${resource}/${editing.id}`, "PUT", body, token);
      } else {
        await apiSend(`/api/admin/${resource}`, "POST", body, token);
      }
      refetch();
      setDialogOpen(false);
    } catch (err) {
      setFormError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <h1>{title}</h1>
        {newLinkTo ? (
          <Link to={newLinkTo} className="btn-primary">
            <Plus /> New {singularize(title)}
          </Link>
        ) : (
          <button className="btn-primary" onClick={openCreate}>
            <Plus /> New {singularize(title)}
          </button>
        )}
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {!isLoading && !isError && items.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/20 flex items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition bg-white"
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="admin-state">
            <div className="admin-spinner" />
            <span>Loading {title.toLowerCase()}…</span>
          </div>
        ) : isError ? (
          <div className="admin-state is-error">
            <div className="admin-state-icon">
              <AlertCircle size={20} />
            </div>
            <span>Couldn't load {title.toLowerCase()}.</span>
          </div>
        ) : items.length === 0 ? (
          <div className="admin-state">
            <div className="admin-state-icon">
              <Inbox size={20} />
            </div>
            <span>No {title.toLowerCase()} yet.</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-state">
            <div className="admin-state-icon">
              <Inbox size={20} />
            </div>
            <span>No matching {title.toLowerCase()} found.</span>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  {effectiveColumns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    {effectiveColumns.map((c) => {
                      const field = effectiveFields.find((f) => f.key === c.key);
                      if (field?.type === "icon-select") {
                        const opt = field.options?.find((o) => o.value === item[c.key]);
                        return (
                          <td key={c.key}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {opt?.Icon && (
                                <span
                                  style={{
                                    display: "grid",
                                    placeItems: "center",
                                    width: 24,
                                    height: 24,
                                    borderRadius: 6,
                                    background: "#eef2ff",
                                    color: "var(--primary-blue)",
                                    flexShrink: 0,
                                  }}
                                >
                                  <opt.Icon size={14} />
                                </span>
                              )}
                              {item[c.key]}
                            </span>
                          </td>
                        );
                      }
                      return <td key={c.key}>{String(item[c.key] ?? "")}</td>;
                    })}
                    <td>
                      <div className="action-buttons">
                        {rowLinkTo ? (
                          <Link to={rowLinkTo(item)} className="btn-edit">
                            <Pencil size={13} /> Manage
                          </Link>
                        ) : (
                          <button className="btn-edit" onClick={() => openEdit(item)}>
                            <Pencil size={13} /> Edit
                          </button>
                        )}
                        <button className="btn-delete" onClick={() => handleDelete(item)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="admin-modal-overlay" onClick={() => setDialogOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editing ? `Edit ${singularize(title)}` : `New ${singularize(title)}`}</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDialogOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="admin-modal-body">
                <ResourceFormFields
                  fields={effectiveFields}
                  form={form}
                  onChange={handleFieldChange}
                  uploadingKey={uploadingKey}
                  uploadError={uploadError}
                  onFileUpload={handleFileUpload}
                  products={products}
                />
                {formError && (
                  <p style={{ color: "var(--error-red)", fontSize: "0.85rem" }}>{formError}</p>
                )}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function toFormValues(item, fields) {
  const out = {};
  for (const f of fields) {
    const val = item[f.key];
    if (f.type === "list") {
      out[f.key] = Array.isArray(val) ? val.join("\n") : val || "";
    } else {
      out[f.key] = val ?? "";
    }
  }
  return out;
}

export function fromFormValues(form, fields) {
  const out = {};
  for (const f of fields) {
    const raw = form[f.key];
    if (f.type === "list") {
      out[f.key] = String(raw || "")
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.type === "number") {
      out[f.key] = raw === "" || raw === undefined ? 0 : Number(raw);
    } else {
      out[f.key] = raw;
    }
  }
  return out;
}
