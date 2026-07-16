const { z } = require("zod");
const { pool } = require("../config/db");

// Liste des lots actifs — accessible à tout utilisateur authentifié (typiquement "charge"),
// et l'admin voit aussi les lots désactivés via ?all=true.
async function list(req, res, next) {
  try {
    const showAll = req.query.all === "true" && req.user?.role === "admin";
    const { rows } = await pool.query(
      showAll
        ? `SELECT * FROM credit_packs ORDER BY position`
        : `SELECT * FROM credit_packs WHERE active = true ORDER BY position`
    );
    res.json({
      packs: rows.map((p) => ({
        id: p.id,
        name: p.name,
        credits: p.credits,
        priceCents: p.price_cents,
        discountPercent: p.discount_percent,
        active: p.active,
        position: p.position,
      })),
    });
  } catch (err) {
    next(err);
  }
}

const packSchema = z.object({
  name: z.string().min(2),
  credits: z.number().int().positive(),
  priceCents: z.number().int().min(0),
  discountPercent: z.number().int().min(0).max(100).optional(),
  active: z.boolean().optional(),
  position: z.number().int().optional(),
});

async function create(req, res, next) {
  try {
    const data = packSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO credit_packs (name, credits, price_cents, discount_percent, active, position)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [data.name, data.credits, data.priceCents, data.discountPercent ?? 0, data.active ?? true, data.position ?? 0]
    );
    res.status(201).json({ pack: rows[0] });
  } catch (err) {
    next(err);
  }
}

const updateSchema = packSchema.partial();

async function update(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const fields = [];
    const values = [];
    let i = 1;
    const map = { name: "name", credits: "credits", priceCents: "price_cents", discountPercent: "discount_percent", active: "active", position: "position" };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE credit_packs SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: "Lot introuvable." });
    res.json({ pack: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await pool.query(`DELETE FROM credit_packs WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
