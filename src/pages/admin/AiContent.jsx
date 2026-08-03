import { useEffect, useState } from "react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { ResourceManager } from "@/components/admin/ResourceManager";

const QA_COLUMNS = [
  { key: "question", label: "Question" },
  { key: "topic", label: "Topic" },
  { key: "sort_order", label: "Sort" },
];

const QA_FIELDS = [
  { key: "question", label: "Question", type: "text" },
  { key: "answer", label: "Answer", type: "textarea" },
  { key: "topic", label: "Topic", type: "text" },
  { key: "sort_order", label: "Sort order", type: "number" },
];

const QA_EMPTY = { question: "", answer: "", topic: "", sort_order: 1 };

// Used as a tab inside a product's detail page — no product picker, the slug is passed in.
export function AiTab({ productSlug }) {
  const token = useAdminStore((s) => s.token);
  const {
    data: pageData,
    isLoading: pageLoading,
    refetch: refetchPage,
  } = useApiGet(`/api/experience-pages?product=${productSlug}&page=ai`);

  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (pageData) {
      setHeadline(pageData.headline || "");
      setDescription(pageData.description || "");
      setIntroMessage(pageData.extra?.introMessage || "");
    }
  }, [pageData]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await apiSend(
        `/api/admin/experience-pages?product=${productSlug}&page=ai`,
        "PUT",
        { headline, description, extra: { introMessage } },
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
    <div>
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--slate-800)", marginBottom: 12 }}>
          Page header
        </h3>
        <form onSubmit={handleSave}>
          {pageLoading ? (
            <p style={{ color: "var(--slate-500)", fontSize: "0.9rem" }}>Loading…</p>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="ai-headline">Headline</label>
                <input
                  id="ai-headline"
                  className="form-control"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ai-description">Description</label>
                <textarea
                  id="ai-description"
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ai-intro">Chat intro message</label>
                <textarea
                  id="ai-intro"
                  className="form-control"
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                />
              </div>
              {saveMsg && <p style={{ fontSize: "0.85rem", color: "var(--slate-500)" }}>{saveMsg}</p>}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </form>
      </div>

      <ResourceManager
        resource="ai-qa"
        title="AI Q&A"
        columns={QA_COLUMNS}
        fields={QA_FIELDS}
        emptyItem={QA_EMPTY}
        productSlug={productSlug}
      />
    </div>
  );
}
