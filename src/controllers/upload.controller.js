const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

const MEDIA_DIR = process.env.PROTECTED_MEDIA_DIR || path.join(__dirname, "..", "..", "protected-media");
fs.mkdirSync(MEDIA_DIR, { recursive: true });

const ALLOWED = {
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  doc:   ["application/pdf", "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain"],
};

const MAX_SIZE = {
  video: 500 * 1024 * 1024, // 500 Mo
  doc:   30  * 1024 * 1024, // 30 Mo
};

const EXT = {
  "video/mp4": "mp4", "video/webm": "webm", "video/ogg": "ogv", "video/quicktime": "mov",
  "application/pdf": "pdf", "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

// POST /api/modules/contents/:contentId/upload — reçoit un fichier via
// multipart/form-data, le sauvegarde dans MEDIA_DIR sous un nom aléatoire
// (jamais le nom original pour éviter tout traversal), et met à jour le
// content avec le chemin relatif ainsi que le MIME type.
async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });

    // Vérifie que le contenu existe et appartient à un module que l'utilisateur
    // peut modifier (admin ou pédagogue propriétaire).
    const { rows: contentRows } = await pool.query(
      `SELECT c.id, c.type, c.file_path FROM contents c
       JOIN chapters ch ON ch.id = c.chapter_id
       JOIN modules m ON m.id = ch.module_id
       WHERE c.id = $1`,
      [req.params.contentId]
    );
    if (!contentRows.length) return res.status(404).json({ error: "Contenu introuvable." });
    const content = contentRows[0];
    const expectedType = content.type === "video" ? "video" : "doc";
    const allowed = ALLOWED[expectedType];

    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `Format non supporté pour ce type de contenu. Formats acceptés : ${allowed.join(", ")}.` });
    }
    if (req.file.size > MAX_SIZE[expectedType]) {
      return res.status(400).json({ error: `Fichier trop volumineux (maximum : ${MAX_SIZE[expectedType] / 1024 / 1024} Mo).` });
    }

    const ext = EXT[req.file.mimetype] || "bin";
    const filename = `${req.params.contentId}-${Date.now()}.${ext}`;
    const fullPath = path.join(MEDIA_DIR, filename);

    fs.writeFileSync(fullPath, req.file.buffer);

    // Supprime l'ancien fichier si présent
    if (content.file_path) {
      fs.unlink(path.join(MEDIA_DIR, content.file_path), () => {});
    }

    await pool.query(
      `UPDATE contents SET file_path = $1, mime_type = $2 WHERE id = $3`,
      [filename, req.file.mimetype, req.params.contentId]
    );

    res.json({
      ok: true,
      filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE — retire le fichier du contenu (ne supprime pas le contenu lui-même).
async function removeFile(req, res, next) {
  try {
    const { rows } = await pool.query(
      `UPDATE contents SET file_path = NULL, mime_type = NULL WHERE id = $1 RETURNING file_path`,
      [req.params.contentId]
    );
    if (rows[0]?.file_path) {
      fs.unlink(path.join(MEDIA_DIR, rows[0].file_path), () => {});
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFile, removeFile };
