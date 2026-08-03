import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Inbox, Pencil, Plus, Trash2, X } from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { IconSelect } from "@/components/admin/IconSelect";

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
function slugify(text) {
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

  const { data, isLoading, isError, refetch } = useApiGet(effectiveListPath);
  const items = data ?? [];

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
        <button className="btn-primary" onClick={openCreate}>
          <Plus /> New {title.replace(/s$/, "")}
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
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
                {items.map((item) => (
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
                                    background: "var(--primary-blue-light, #eef2ff)",
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
        <div
          className="mobile-sidebar-backdrop"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="admin-login-box"
            style={{ maxWidth: 560, maxHeight: "85vh", overflowY: "auto", textAlign: "left" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ marginBottom: 0 }}>
                {editing ? `Edit ${title.replace(/s$/, "")}` : `New ${title.replace(/s$/, "")}`}
              </h2>
              <button
                className="dropdown-item"
                style={{ width: "auto", padding: 6 }}
                onClick={() => setDialogOpen(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              {effectiveFields.map((f) => (
                <div key={f.key} className="form-group">
                  <label htmlFor={f.key}>{f.label}</label>
                  {f.type === "product" ? (
                    <select
                      id={f.key}
                      className="form-control"
                      value={form[f.key] ?? ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    >
                      <option value="" disabled>
                        Select a product…
                      </option>
                      {products.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "icon-select" ? (
                    <IconSelect
                      id={f.key}
                      value={form[f.key] ?? ""}
                      onChange={(v) => handleFieldChange(f.key, v)}
                      options={f.options}
                    />
                  ) : f.type === "select" ? (
                    <select
                      id={f.key}
                      className="form-control"
                      value={form[f.key] ?? ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    >
                      <option value="" disabled>
                        Select {f.label.toLowerCase()}…
                      </option>
                      {f.options?.map((opt) => {
                        const val = typeof opt === "string" ? opt : opt.value;
                        const label = typeof opt === "string" ? opt : opt.label;
                        return (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  ) : f.type === "textarea" || f.type === "list" ? (
                    <textarea
                      id={f.key}
                      className="form-control"
                      value={form[f.key] ?? ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      placeholder={f.type === "list" ? "Comma or newline separated" : undefined}
                    />
                  ) : (
                    <input
                      id={f.key}
                      className="form-control"
                      type={f.type === "number" ? "number" : "text"}
                      value={form[f.key] ?? ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    />
                  )}
                  {f.helperText && (
                    <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: 4 }}>
                      {f.helperText}
                    </p>
                  )}
                </div>
              ))}
              {formError && (
                <p style={{ color: "var(--error-red)", fontSize: "0.85rem", marginBottom: 12 }}>
                  {formError}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDialogOpen(false)}
                >
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

function toFormValues(item, fields) {
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

function fromFormValues(form, fields) {
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
