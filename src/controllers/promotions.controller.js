const { z } = require("zod");
const { pool } = require("../config/db");

// Renvoie, pour un module donné, la promotion actuellement active (parmi
// celles marquées active=true et dont la période couvre l'instant présent),
// ou null. En cas de chevauchement (ne devrait pas arriver en usage normal),
// la remise la plus forte l'emporte.
async function getActivePromotion(moduleId) {
  const { rows } = await pool.query(
    `SELECT * FROM module_promotions
     WHERE module_id = $1 AND active = true AND now() BETWEEN starts_at AND ends_at
     ORDER BY discount_percent DESC LIMIT 1`,
    [moduleId]
  );
  return rows[0] || null;
}

// Version "en lot" pour la liste du catalogue — évite une requête par module.
async function getActivePromotionsForModules(moduleIds) {
  if (moduleIds.length === 0) return {};
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (module_id) * FROM module_promotions
     WHERE module_id = ANY($1::text[]) AND active = true AND now() BETWEEN starts_at AND ends_at
     ORDER BY module_id, discount_percent DESC`,
    [moduleIds]
  );
  return Object.fromEntries(rows.map((r) => [r.module_id, r]));
}

async function listAll(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, m.title AS module_title FROM module_promotions p
       JOIN modules m ON m.id = p.module_id ORDER BY p.starts_at DESC`
    );
    const now = new Date();
    res.json({
      promotions: rows.map((r) => ({
        id: r.id,
        moduleId: r.module_id,
        moduleTitle: r.module_title,
        discountPercent: Number(r.discount_percent),
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        active: r.active,
        status: !r.active ? "disabled" : now < new Date(r.starts_at) ? "scheduled" : now > new Date(r.ends_at) ? "expired" : "live",
      })),
    });
  } catch (err) {
    next(err);
  }
}

const promoSchema = z.object({
  moduleId: z.string().min(1),
  discountPercent: z.number().min(0.5).max(95),
  startsAt: z.string().datetime().or(z.string().min(1)),
  endsAt: z.string().datetime().or(z.string().min(1)),
  active: z.boolean().optional(),
});

async function create(req, res, next) {
  try {
    const data = promoSchema.parse(req.body);
    if (new Date(data.endsAt) <= new Date(data.startsAt)) {
      return res.status(400).json({ error: "La date de fin doit être après la date de début." });
    }
    const { rows: modRows } = await pool.query(`SELECT id FROM modules WHERE id = $1`, [data.moduleId]);
    if (modRows.length === 0) return res.status(404).json({ error: "Module introuvable." });

    const { rows } = await pool.query(
      `INSERT INTO module_promotions (module_id, discount_percent, starts_at, ends_at, active)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.moduleId, data.discountPercent, data.startsAt, data.endsAt, data.active ?? true]
    );
    res.status(201).json({ promotion: rows[0] });
  } catch (err) {
    next(err);
  }
}

const updateSchema = promoSchema.partial();

async function update(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const fields = [];
    const values = [];
    let i = 1;
    const map = { moduleId: "module_id", discountPercent: "discount_percent", startsAt: "starts_at", endsAt: "ends_at", active: "active" };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) { fields.push(`${col} = $${i++}`); values.push(data[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE module_promotions SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: "Promotion introuvable." });
    res.json({ promotion: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await pool.query(`DELETE FROM module_promotions WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listAll, create, update, remove, getActivePromotion, getActivePromotionsForModules };
