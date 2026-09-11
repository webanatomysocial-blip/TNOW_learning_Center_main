import { UploadCloud } from "lucide-react";
import { API_URL } from "@/lib/api";
import { IconSelect } from "@/components/admin/IconSelect";

// The actual `<label>+<input>` block for one resource field, switched on
// `field.type`. Extracted out of ResourceManager's modal so the exact same
// field rendering can also be used by a full-page form (e.g. StoryFormPage) —
// a resource that needs its own dedicated page instead of a quick modal
// shouldn't have to reimplement image/file upload, product pickers, etc.
export function ResourceFormFields({ fields, form, onChange, uploadingKey, uploadError, onFileUpload, products }) {
  return (
    <>
      {fields.map((f) => (
        <div key={f.key} className="form-group">
          <label htmlFor={f.key}>{f.label}</label>
          {f.type === "product" ? (
            <select
              id={f.key}
              className="form-control"
              value={form[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            >
              <option value="" disabled>
                Select a product…
              </option>
              {(products ?? []).map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : f.type === "icon-select" ? (
            <IconSelect id={f.key} value={form[f.key] ?? ""} onChange={(v) => onChange(f.key, v)} options={f.options} />
          ) : f.type === "select" ? (
            <select
              id={f.key}
              className="form-control"
              value={form[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
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
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.type === "list" ? "Comma or newline separated" : undefined}
            />
          ) : f.type === "image" ? (
            <div>
              {form[f.key] && (
                <img
                  src={form[f.key].startsWith("/") ? `${API_URL}${form[f.key]}` : form[f.key]}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: 140,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginBottom: 8,
                    border: "1px solid var(--slate-200)",
                  }}
                />
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <label
                  className="btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: uploadingKey === f.key ? "wait" : "pointer" }}
                >
                  <UploadCloud size={14} />
                  {uploadingKey === f.key ? "Uploading…" : "Upload image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    style={{ display: "none" }}
                    disabled={uploadingKey === f.key}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onFileUpload(f.key, file, "image");
                      e.target.value = "";
                    }}
                  />
                </label>
                <input
                  id={f.key}
                  className="form-control"
                  type="text"
                  placeholder="…or paste an image URL"
                  value={form[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: 4 }}>
                Only files under 50MB will be uploaded.
              </p>
              {uploadError && (
                <p style={{ fontSize: "0.75rem", color: "var(--error-red)", marginTop: 4 }}>{uploadError}</p>
              )}
            </div>
          ) : f.type === "file" ? (
            <div>
              <div style={{ display: "flex", gap: 8 }}>
                <label
                  className="btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: uploadingKey === f.key ? "wait" : "pointer" }}
                >
                  <UploadCloud size={14} />
                  {uploadingKey === f.key ? "Uploading…" : "Upload PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    disabled={uploadingKey === f.key}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onFileUpload(f.key, file, "document");
                      e.target.value = "";
                    }}
                  />
                </label>
                <input
                  id={f.key}
                  className="form-control"
                  type="text"
                  placeholder="…or paste a PDF URL"
                  value={form[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              </div>
              {form[f.key] && (
                <a
                  href={form[f.key].startsWith("/") ? `${API_URL}${form[f.key]}` : form[f.key]}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "0.75rem", marginTop: 6, display: "inline-block" }}
                >
                  View current file ↗
                </a>
              )}
              <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: 4 }}>
                Only files under 50MB will be uploaded.
              </p>
              {uploadError && (
                <p style={{ fontSize: "0.75rem", color: "var(--error-red)", marginTop: 4 }}>{uploadError}</p>
              )}
            </div>
          ) : (
            <input
              id={f.key}
              className="form-control"
              type={f.type === "number" ? "number" : "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          )}
          {f.helperText && (
            <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: 4 }}>{f.helperText}</p>
          )}
        </div>
      ))}
    </>
  );
}
