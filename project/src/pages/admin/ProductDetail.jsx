import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import { CapabilitiesTab } from "@/pages/admin/Capabilities";
import { StoriesTab } from "@/pages/admin/Stories";
import { WhyTab } from "@/pages/admin/WhyContent";
import { AiTab } from "@/pages/admin/AiContent";
import { BookTab } from "@/pages/admin/BookContent";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// Matches what the customer-facing product cards show for each status (see
// ProductSelection.jsx) — kept in sync automatically when Status changes below.
const DEFAULT_CTA = { available: "Start Experience", coming: "Notify Me" };

// Ordered to match the actual customer-facing flow: Welcome (Overview) → Why →
// Product Tour (Capabilities) → Customer Stories → AI Expert → Book Workshop.
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "why", label: "Why Content" },
  { id: "capabilities", label: "Product Tour" },
  { id: "stories", label: "Customer Stories" },
  { id: "ai", label: "AI Expert" },
  { id: "book", label: "Book Workshop" },
];

function OverviewTab({ product, onSaved }) {
  const token = useAdminStore((s) => s.token);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        slug: product.slug || "",
        tagline: product.tagline || "",
        description: product.description || "",
        capabilities_tags: Array.isArray(product.capabilities_tags)
          ? product.capabilities_tags.join(", ")
          : "",
        time: product.time || "",
        status: product.status || "coming",
        cta: product.cta || "",
        sort_order: product.sort_order ?? 1,
      });
    }
  }, [product]);

  if (!form) return null;

  function set(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && "slug" in prev) {
        const currentSlug = prev.slug || "";
        const slugifiedPrev = slugify(prev.name || "");
        if (!currentSlug || currentSlug === slugifiedPrev) {
          next.slug = slugify(value);
        }
      }
      // Only auto-swap the CTA text if it still matches the default for the
      // status being left (or is empty) — an admin who typed something custom
      // ("Join the Waitlist") shouldn't have it silently overwritten.
      if (key === "status" && "cta" in prev) {
        const currentCta = prev.cta || "";
        if (!currentCta || currentCta === DEFAULT_CTA[prev.status]) {
          next.cta = DEFAULT_CTA[value] ?? currentCta;
        }
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await apiSend(
        `/api/admin/products/${product.id}`,
        "PUT",
        {
          ...form,
          capabilities_tags: form.capabilities_tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          sort_order: Number(form.sort_order) || 1,
        },
        token,
      );
      setSaveMsg("Saved.");
      onSaved?.();
    } catch (err) {
      setSaveMsg(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" className="form-control" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="slug">Slug</label>
          <input id="slug" className="form-control" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="tagline">Tagline</label>
          <input id="tagline" className="form-control" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-control"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="capabilities_tags">Capability tags (comma separated)</label>
          <input
            id="capabilities_tags"
            className="form-control"
            value={form.capabilities_tags}
            onChange={(e) => set("capabilities_tags", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="time">Time (e.g. 12 min)</label>
          <input id="time" className="form-control" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" className="form-control" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="available">available</option>
            <option value="coming">coming</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="cta">CTA label</label>
          <input id="cta" className="form-control" value={form.cta} onChange={(e) => set("cta", e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="sort_order">Sort order</label>
          <input
            id="sort_order"
            type="number"
            className="form-control"
            value={form.sort_order}
            onChange={(e) => set("sort_order", e.target.value)}
          />
        </div>
        {saveMsg && <p style={{ fontSize: "0.85rem", color: "var(--slate-500)" }}>{saveMsg}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? (
            <Loader2 className="admin-btn-spin" />
          ) : (
            <Check />
          )}
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, refetch } = useApiGet(`/api/products/${id}`);
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState(
    TABS.some((t) => t.id === requestedTab) ? requestedTab : "overview",
  );

  useDocumentHead({ meta: [{ title: product ? `${product.name} — Admin` : "Product — Admin" }] });

  if (isLoading) {
    return (
      <div className="admin-state">
        <div className="admin-spinner" />
        <span>Loading product…</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="admin-card">
        <div className="admin-state is-error">
          <span>Couldn't load this product.</span>
        </div>
        <Link
          to="/admin/products"
          className="btn-secondary"
          style={{ marginTop: 12, display: "inline-flex" }}
        >
          <ArrowLeft size={15} /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper">
      <button
        onClick={() => navigate("/admin/products")}
        className="dropdown-item"
        style={{ width: "auto", padding: 0, marginBottom: 12, color: "var(--slate-500)" }}
      >
        <ArrowLeft size={16} /> Back to Products
      </button>

      <div className="admin-header-actions">
        <h1>{product.name}</h1>
      </div>

      <div className="tab-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-nav-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === "overview" && <OverviewTab product={product} onSaved={refetch} />}
        {tab === "capabilities" && <CapabilitiesTab productSlug={product.slug} />}
        {tab === "stories" && <StoriesTab productSlug={product.slug} />}
        {tab === "why" && <WhyTab productSlug={product.slug} />}
        {tab === "ai" && <AiTab productSlug={product.slug} />}
        {tab === "book" && <BookTab productSlug={product.slug} />}
      </div>
    </div>
  );
}
