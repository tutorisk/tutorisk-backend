const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const { pool } = require("../config/db");

const ASSETS_DIR = process.env.CERTIFICATE_ASSETS_DIR || path.join(__dirname, "..", "..", "certificate-assets");
fs.mkdirSync(ASSETS_DIR, { recursive: true });

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/svg+xml"];
const EMBEDDABLE_MIME = ["image/png", "image/jpeg"]; // pdfkit ne sait intégrer que ces deux formats

async function getSettings(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM certificate_settings WHERE id = 1`);
    const s = rows[0];
    res.json({
      titleText: s.title_text,
      introText: s.intro_text,
      subtitleText: s.subtitle_text,
      footerText: s.footer_text,
      signatoryName: s.signatory_name,
      signatoryTitle: s.signatory_title,
      hasStamp: !!s.stamp_path,
      stampEmbeddable: s.stamp_mime ? EMBEDDABLE_MIME.includes(s.stamp_mime) : null,
      hasSignature: !!s.signature_path,
      signatureEmbeddable: s.signature_mime ? EMBEDDABLE_MIME.includes(s.signature_mime) : null,
      updatedAt: s.updated_at,
    });
  } catch (err) {
    next(err);
  }
}

const textSchema = z.object({
  titleText: z.string().min(1).max(120).optional(),
  introText: z.string().min(1).max(160).optional(),
  subtitleText: z.string().min(1).max(160).optional(),
  footerText: z.string().min(1).max(200).optional(),
  signatoryName: z.string().min(1).max(120).optional(),
  signatoryTitle: z.string().min(1).max(120).optional(),
});

async function updateText(req, res, next) {
  try {
    const data = textSchema.parse(req.body);
    const fields = [];
    const values = [];
    let i = 1;
    const map = {
      titleText: "title_text", introText: "intro_text", subtitleText: "subtitle_text",
      footerText: "footer_text", signatoryName: "signatory_name", signatoryTitle: "signatory_title",
    };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) { fields.push(`${col} = $${i++}`); values.push(data[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    fields.push(`updated_at = now()`);
    await pool.query(`UPDATE certificate_settings SET ${fields.join(", ")} WHERE id = 1`, values);
    await getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
}

// type: "stamp" | "signature"
function uploadImage(type) {
  return async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });
      if (!ALLOWED_MIME.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Format non supporté. Utilisez un PNG, JPEG ou SVG." });
      }

      const { rows: current } = await pool.query(`SELECT ${type}_path FROM certificate_settings WHERE id = 1`);
      const oldPath = current[0]?.[`${type}_path`];

      const ext = req.file.mimetype === "image/png" ? "png" : req.file.mimetype === "image/jpeg" ? "jpg" : "svg";
      const filename = `${type}-${Date.now()}.${ext}`;
      const filePath = path.join(ASSETS_DIR, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      await pool.query(
        `UPDATE certificate_settings SET ${type}_path = $1, ${type}_mime = $2, updated_at = now() WHERE id = 1`,
        [filename, req.file.mimetype]
      );

      // Nettoyage du précédent fichier, si différent
      if (oldPath) {
        const oldFullPath = path.join(ASSETS_DIR, oldPath);
        fs.unlink(oldFullPath, () => {});
      }

      const embeddable = EMBEDDABLE_MIME.includes(req.file.mimetype);
      res.json({
        ok: true,
        embeddable,
        warning: embeddable ? null : "Les fichiers SVG sont conservés pour référence mais ne peuvent pas être intégrés tels quels dans le PDF (limitation technique du générateur). Utilisez un PNG ou JPEG pour qu'il apparaisse réellement sur l'attestation.",
      });
    } catch (err) {
      next(err);
    }
  };
}

// type: "stamp" | "signature"
function removeImage(type) {
  return async (req, res, next) => {
    try {
      const { rows: current } = await pool.query(`SELECT ${type}_path FROM certificate_settings WHERE id = 1`);
      const oldPath = current[0]?.[`${type}_path`];
      await pool.query(`UPDATE certificate_settings SET ${type}_path = NULL, ${type}_mime = NULL, updated_at = now() WHERE id = 1`);
      if (oldPath) fs.unlink(path.join(ASSETS_DIR, oldPath), () => {});
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}

// type: "stamp" | "signature" — aperçu admin (jamais exposé publiquement)
function previewImage(type) {
  return async (req, res, next) => {
    try {
      const { rows } = await pool.query(`SELECT ${type}_path, ${type}_mime FROM certificate_settings WHERE id = 1`);
      const filePath = rows[0]?.[`${type}_path`];
      const mime = rows[0]?.[`${type}_mime`];
      if (!filePath) return res.status(404).json({ error: "Aucune image configurée." });
      res.setHeader("Content-Type", mime || "application/octet-stream");
      fs.createReadStream(path.join(ASSETS_DIR, filePath)).pipe(res);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { getSettings, updateText, uploadImage, removeImage, previewImage, ASSETS_DIR, EMBEDDABLE_MIME };
