const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const express = require("express");
const multer = require("multer");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

const IMAGE_DIR = path.join(__dirname, "..", "uploads", "images");
const DOCUMENT_DIR = path.join(__dirname, "..", "uploads", "documents");
fs.mkdirSync(IMAGE_DIR, { recursive: true });
fs.mkdirSync(DOCUMENT_DIR, { recursive: true });

// Whitelist by mimetype, not by trusting the client-supplied extension — the
// extension on disk is derived from the whitelisted mimetype, not the
// original filename, so a "photo.jpg.php" upload can't land as executable.
// SVG deliberately excluded — it's an XML format that can embed <script>, and
// since uploads are served statically with no CSP, an uploaded SVG opened
// directly in a browser tab would execute as same-origin script.
const IMAGE_MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const DOCUMENT_MIME_TO_EXT = {
  "application/pdf": ".pdf",
};

function makeUploader(dir, mimeToExt, label) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${mimeToExt[file.mimetype]}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      if (!mimeToExt[file.mimetype]) {
        return cb(new Error(`Only ${label} files are allowed`));
      }
      cb(null, true);
    },
  });
}

const uploadImage = makeUploader(IMAGE_DIR, IMAGE_MIME_TO_EXT, "JPEG, PNG, WEBP, or GIF image");
const uploadDocument = makeUploader(DOCUMENT_DIR, DOCUMENT_MIME_TO_EXT, "PDF");

// Admin-only — used by the Capabilities (and any future) admin form to upload a
// thumbnail image instead of pasting an external URL. Returns the path to store
// on the resource (e.g. capabilities.image_url); actual file serving is wired up
// as static middleware in server/index.js.
router.post("/api/admin/uploads/image", requireAdmin, (req, res) => {
  uploadImage.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    res.json({ url: `/uploads/images/${req.file.filename}` });
  });
});

// Admin-only — used for story case-study PDFs (stories.download_url).
router.post("/api/admin/uploads/document", requireAdmin, (req, res) => {
  uploadDocument.single("document")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No document file provided" });
    }
    res.json({ url: `/uploads/documents/${req.file.filename}` });
  });
});

module.exports = router;
