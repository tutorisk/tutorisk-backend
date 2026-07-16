const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const { pool } = require("../config/db");

const ASSETS_DIR = process.env.BANNER_ASSETS_DIR || path.join(__dirname, "..", "..", "banner-assets");
fs.mkdirSync(ASSETS_DIR, { recursive: true });

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

function toPublic(row) {
  return {
    id: row.id,
    text: row.text,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    hasImage: !!row.image_path,
    showOnHome: row.show_on_home,
    showOnCatalog: row.show_on_catalog,
    showOnDashboard: row.show_on_dashboard,
    active: row.active,
    position: row.position,
  };
}

// GET /api/banners?page=home|catalog|dashboard — public, ne renvoie que les
// bannières actives ciblant la page demandée.
async function listForPage(req, res, next) {
  try {
    const page = req.query.page;
    const colByPage = { home: "show_on_home", catalog: "show_on_catalog", dashboard: "show_on_dashboard" };
    const col = colByPage[page];
    if (!col) return res.json({ banners: [] });

    const { rows } = await pool.query(
      `SELECT * FROM banners WHERE active = true AND ${col} = true ORDER BY position`
    );
    res.json({ banners: rows.map(toPublic) });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/banners — admin, toutes les bannières (actives ou non).
async function listAll(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM banners ORDER BY position, created_at`);
    res.json({ banners: rows.map(toPublic) });
  } catch (err) {
    next(err);
  }
}

const bannerSchema = z.object({
  text: z.string().max(300).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale invalide (ex: #CC1515)").optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale invalide (ex: #FFFFFF)").optional(),
  showOnHome: z.boolean().optional(),
  showOnCatalog: z.boolean().optional(),
  showOnDashboard: z.boolean().optional(),
  active: z.boolean().optional(),
  position: z.number().int().optional(),
});

async function create(req, res, next) {
  try {
    const data = bannerSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO banners (text, background_color, text_color, show_on_home, show_on_catalog, show_on_dashboard, active, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.text ?? "",
        data.backgroundColor ?? "#CC1515",
        data.textColor ?? "#FFFFFF",
        data.showOnHome ?? false,
        data.showOnCatalog ?? false,
        data.showOnDashboard ?? false,
        data.active ?? true,
        data.position ?? 0,
      ]
    );
    res.status(201).json({ banner: toPublic(rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = bannerSchema.parse(req.body);
    const fields = [];
    const values = [];
    let i = 1;
    const map = {
      text: "text", backgroundColor: "background_color", textColor: "text_color",
      showOnHome: "show_on_home", showOnCatalog: "show_on_catalog", showOnDashboard: "show_on_dashboard",
      active: "active", position: "position",
    };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) { fields.push(`${col} = $${i++}`); values.push(data[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE banners SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: "Bannière introuvable." });
    res.json({ banner: toPublic(rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT image_path FROM banners WHERE id = $1`, [req.params.id]);
    await pool.query(`DELETE FROM banners WHERE id = $1`, [req.params.id]);
    if (rows[0]?.image_path) fs.unlink(path.join(ASSETS_DIR, rows[0].image_path), () => {});
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });
    if (!ALLOWED_MIME.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Format non supporté. Utilisez un PNG, JPEG, WEBP ou SVG." });
    }

    const { rows: current } = await pool.query(`SELECT image_path FROM banners WHERE id = $1`, [req.params.id]);
    if (current.length === 0) return res.status(404).json({ error: "Bannière introuvable." });
    const oldPath = current[0].image_path;

    const ext = { "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg", "image/webp": "webp" }[req.file.mimetype];
    const filename = `banner-${req.params.id}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(ASSETS_DIR, filename), req.file.buffer);

    await pool.query(`UPDATE banners SET image_path = $1, image_mime = $2 WHERE id = $3`, [filename, req.file.mimetype, req.params.id]);
    if (oldPath) fs.unlink(path.join(ASSETS_DIR, oldPath), () => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function removeImage(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT image_path FROM banners WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Bannière introuvable." });
    await pool.query(`UPDATE banners SET image_path = NULL, image_mime = NULL WHERE id = $1`, [req.params.id]);
    if (rows[0].image_path) fs.unlink(path.join(ASSETS_DIR, rows[0].image_path), () => {});
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// GET /api/banners/:id/image — public (la bannière elle-même est publique
// dès lors qu'elle est active, son image doit donc être accessible sans auth).
async function serveImage(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT image_path, image_mime FROM banners WHERE id = $1`, [req.params.id]);
    if (!rows[0]?.image_path) return res.status(404).end();
    res.setHeader("Content-Type", rows[0].image_mime || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=3600");
    fs.createReadStream(path.join(ASSETS_DIR, rows[0].image_path)).pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { listForPage, listAll, create, update, remove, uploadImage, removeImage, serveImage };
