import { useState } from "react";
import { API_URL } from "@/lib/api";

// Shared by ResourceManager's modal and any full-page resource form (e.g.
// StoryFormPage) — uploads a file to /api/admin/uploads/:kind and hands the
// returned URL to `onDone` (usually a form-field setter).
export function useFileUpload(token) {
  const [uploadingKey, setUploadingKey] = useState(null);
  const [uploadError, setUploadError] = useState("");

  async function handleFileUpload(key, file, kind, onDone) {
    setUploadError("");
    setUploadingKey(key);
    try {
      const body = new FormData();
      body.append(kind, file);
      const res = await fetch(`${API_URL}/api/admin/uploads/${kind}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");
      onDone(key, data.url);
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  }

  return { uploadingKey, uploadError, handleFileUpload };
}
