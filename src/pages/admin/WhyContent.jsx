import { useEffect, useState } from "react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { WHY_ICON_OPTIONS } from "@/lib/why-icons";

const FEATURE_COLUMNS = [
  { key: "icon", label: "Icon" },
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "sort_order", label: "Sort" },
];

const FEATURE_FIELDS = [
  {
    key: "icon",
    label: "Icon",
    type: "icon-select",
    options: WHY_ICON_OPTIONS,
    helperText: "Pick the icon shown next to this feature.",
  },
  { key: "title", label: "Title", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "sort_order", label: "Sort order", type: "number" },
];

const FEATURE_EMPTY = { icon: "Timer", title: "", description: "", sort_order: 1 };

// Used as a tab inside a product's detail page — no product picker, the slug is passed in.
export function WhyTab({ productSlug }) {
  const token = useAdminStore((s) => s.token);
  const {
    data: pageData,
    isLoading: pageLoading,
    refetch: refetchPage,
  } = useApiGet(`/api/experience-pages?product=${productSlug}&page=why`);

  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (pageData) {
      setHeadline(pageData.headline || "");
      setDescription(pageData.description || "");
      setVideoTitle(pageData.extra?.videoTitle || "");
      setVideoDuration(pageData.extra?.videoDuration || "");
      setVideoUrl(pageData.extra?.videoUrl || "");
    }
  }, [pageData]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await apiSend(
        `/api/admin/experience-pages?product=${productSlug}&page=why`,
        "PUT",
        { headline, description, extra: { videoTitle, videoDuration, videoUrl } },
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
                <label htmlFor="why-headline">Headline</label>
                <input
                  id="why-headline"
                  className="form-control"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="why-description">Description</label>
                <textarea
                  id="why-description"
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="why-video-title">Video title</label>
                <input
                  id="why-video-title"
                  className="form-control"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="why-video-duration">Video duration (e.g. 2 min 48 sec)</label>
                <input
                  id="why-video-duration"
                  className="form-control"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="why-video-url">Video URL</label>
                <input
                  id="why-video-url"
                  className="form-control"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: 4 }}>
                  YouTube, Vimeo, Gumlet, or a direct .mp4/.webm link. If left blank, the
                  simulated demo animation is shown instead.
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

      <ResourceManager
        resource="why-features"
        title="Why Features"
        columns={FEATURE_COLUMNS}
        fields={FEATURE_FIELDS}
        emptyItem={FEATURE_EMPTY}
        productSlug={productSlug}
      />
    </div>
  );
}
