import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Info, Image as ImageIcon, Quote, Download, ListOrdered } from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import { useFileUpload } from "@/lib/use-file-upload";
import { ResourceFormFields } from "@/components/admin/ResourceFormFields";
import { toFormValues, fromFormValues, slugify } from "@/components/admin/ResourceManager";
import { FIELDS, EMPTY } from "@/pages/admin/Stories";

function byKey(keys) {
  return FIELDS.filter((f) => keys.includes(f.key));
}

const SECTIONS = [
  { title: "Basic Details", icon: Info, keys: ["product_slug", "company", "industry"] },
  { title: "Download", icon: Download, keys: ["download_url"] },
  { title: "Story", icon: ImageIcon, wide: true, keys: ["photo_url", "challenge", "solution", "results"] },
  {
    title: "Testimonial Quote",
    icon: Quote,
    description: "Optional — powers the quote block and stat tiles shown when a customer opens this story.",
    wide: true,
    keys: ["person_name", "person_title"],
    statGroups: [
      ["stat1_value", "stat1_label", "stat1_description"],
      ["stat2_value", "stat2_label", "stat2_description"],
    ],
  },
  { title: "Display", icon: ListOrdered, wide: true, keys: ["sort_order"] },
];

function SectionCard({ section, form, onChange, uploadingKey, uploadError, onFileUpload, products }) {
  const Icon = section.icon;
  return (
    <div className="admin-card" style={{ marginTop: 0, gridColumn: section.wide ? "1 / -1" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: section.description ? 4 : 18 }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#eef2ff",
            color: "var(--primary-blue)",
            flexShrink: 0,
          }}
        >
          <Icon size={15} />
        </span>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--slate-800)", margin: 0 }}>
          {section.title}
        </h3>
      </div>
      {section.description && (
        <p style={{ fontSize: "0.8rem", color: "var(--slate-500)", margin: "0 0 18px 40px" }}>
          {section.description}
        </p>
      )}
      <ResourceFormFields
        fields={byKey(section.keys)}
        form={form}
        onChange={onChange}
        uploadingKey={uploadingKey}
        uploadError={uploadError}
        onFileUpload={onFileUpload}
        products={products}
      />
      {section.statGroups && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {section.statGroups.map((keys, i) => (
            <div key={i}>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--slate-400)",
                  marginBottom: 10,
                }}
              >
                Stat tile {i + 1}
              </p>
              <ResourceFormFields fields={byKey(keys)} form={form} onChange={onChange} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// A real page (own URL, back/forward, no overlay) for creating/editing a
// single customer story — the fields are the same as the quick-modal editor
// (shared via FIELDS/ResourceFormFields), just laid out full-page instead of
// in a popup, per direct request for this one resource.
export function StoryFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !id;
  useDocumentHead({ meta: [{ title: `${isNew ? "New" : "Edit"} Customer Story — Admin` }] });
  const navigate = useNavigate();
  const token = useAdminStore((s) => s.token);

  const { data: existing } = useApiGet(isNew ? null : `/api/stories/${id}`, { enabled: !isNew });
  const { data: productsData } = useApiGet("/api/products");
  const products = productsData ?? [];

  const presetProduct = searchParams.get("product");
  const { data: existingStories } = useApiGet(
    isNew ? (presetProduct ? `/api/stories?product=${presetProduct}` : "/api/stories") : null,
    { enabled: isNew },
  );
  const [form, setForm] = useState(presetProduct ? { ...EMPTY, product_slug: presetProduct } : EMPTY);
  const backSlug = presetProduct || existing?.product_slug;
  const backProduct = backSlug ? products.find((p) => p.slug === backSlug) : null;
  const backTo = backProduct ? `/admin/products/${backProduct.id}?tab=stories` : "/admin/stories";
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const { uploadingKey, uploadError, handleFileUpload: uploadFile } = useFileUpload(token);

  useEffect(() => {
    if (existing) setForm(toFormValues(existing, FIELDS));
  }, [existing]);

  // Auto-append to the end of the list instead of always defaulting to 1 —
  // same fix as ResourceManager's openCreate, but this resource uses a full
  // page instead of the shared modal so it needs its own copy.
  useEffect(() => {
    if (isNew && existingStories) {
      const nextSortOrder =
        existingStories.reduce((max, s) => Math.max(max, Number(s.sort_order) || 0), 0) + 1;
      setForm((prev) => ({ ...prev, sort_order: nextSortOrder }));
    }
  }, [isNew, existingStories]);

  function handleFieldChange(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "company" && "slug" in prev) {
        const currentSlug = prev.slug || "";
        if (!currentSlug || currentSlug === slugify(prev.company || "")) {
          next.slug = slugify(value);
        }
      }
      return next;
    });
  }

  function handleFileUpload(key, file, kind) {
    uploadFile(key, file, kind, handleFieldChange);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    const body = fromFormValues(form, FIELDS);
    try {
      if (isNew) {
        await apiSend("/api/admin/stories", "POST", body, token);
      } else {
        await apiSend(`/api/admin/stories/${id}`, "PUT", body, token);
      }
      navigate(backTo);
    } catch (err) {
      setFormError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <div>
          <Link
            to={backTo}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--slate-500)", marginBottom: 8 }}
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <h1>{isNew ? "New Customer Story" : "Edit Customer Story"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 1200 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
          {SECTIONS.map((section) => (
            <SectionCard
              key={section.title}
              section={section}
              form={form}
              onChange={handleFieldChange}
              uploadingKey={uploadingKey}
              uploadError={uploadError}
              onFileUpload={handleFileUpload}
              products={products}
            />
          ))}
        </div>

        {formError && (
          <p style={{ color: "var(--error-red)", fontSize: "0.85rem", marginTop: 16 }}>{formError}</p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
            paddingTop: 20,
            borderTop: "1px solid var(--slate-200)",
          }}
        >
          <Link to={backTo} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
