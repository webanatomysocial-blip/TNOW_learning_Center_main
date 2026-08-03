import { useEffect, useState } from "react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

// Used as a tab inside a product's detail page — no product picker, the slug is passed in.
export function BookTab({ productSlug }) {
  const token = useAdminStore((s) => s.token);
  const {
    data: pageData,
    isLoading: pageLoading,
    refetch: refetchPage,
  } = useApiGet(`/api/experience-pages?product=${productSlug}&page=book`);

  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (pageData) {
      setHeadline(pageData.headline || "");
      setDescription(pageData.description || "");
      setCalendlyUrl(pageData.extra?.calendlyUrl || "");
    }
  }, [pageData]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await apiSend(
        `/api/admin/experience-pages?product=${productSlug}&page=book`,
        "PUT",
        { headline, description, extra: { calendlyUrl } },
        token,
      );
      setSaveMsg("Saved.");
      refetchPage();
    } catch (err) {
      setSaveMsg(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card">
      <form onSubmit={handleSave}>
        {pageLoading ? (
          <p style={{ color: "var(--slate-500)", fontSize: "0.9rem" }}>Loading…</p>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="book-headline">Headline</label>
              <input
                id="book-headline"
                className="form-control"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Let's tailor a workshop for your team"
              />
            </div>
            <div className="form-group">
              <label htmlFor="book-description">Description</label>
              <textarea
                id="book-description"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A 45-minute working session with a consultant, shaped by everything you've explored."
              />
            </div>
            <div className="form-group">
              <label htmlFor="book-calendly-url">Scheduling link</label>
              <input
                id="book-calendly-url"
                className="form-control"
                value={calendlyUrl}
                onChange={(e) => setCalendlyUrl(e.target.value)}
                placeholder="https://calendly.com/your-name/workshop"
              />
              <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: 4 }}>
                Paste a Calendly or TidyCal event link (e.g. calendly.com/your-name/workshop or
                tidycal.com/your-name/workshop) — the scheduling page customers see is embedded
                directly from it.
              </p>
            </div>
            {saveMsg && <p style={{ fontSize: "0.85rem", color: "var(--slate-500)" }}>{saveMsg}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
