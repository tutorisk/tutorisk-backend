const { z } = require("zod");
const { pool } = require("../config/db");
const { resolveVatRate, computeTtcCents } = require("../utils/vat");

// GET /api/vat/rate?countryCode=FR&postalCode=97133 — public, utilisé par le
// frontend pour recalculer le prix TTC en direct selon le code postal saisi.
async function getRate(req, res, next) {
  try {
    const countryCode = req.query.countryCode || "FR";
    const postalCode = req.query.postalCode || "";
    const result = await resolveVatRate(countryCode, postalCode);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ── Taux par défaut par pays (admin) ─────────────────────────
async function listCountryDefaults(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM vat_country_defaults ORDER BY country_name`);
    res.json({
      countries: rows.map((r) => ({
        countryCode: r.country_code,
        countryName: r.country_name,
        defaultRatePercent: Number(r.default_rate_percent),
      })),
    });
  } catch (err) {
    next(err);
  }
}

const countrySchema = z.object({
  countryCode: z.string().min(2).max(2),
  countryName: z.string().min(2),
  defaultRatePercent: z.number().min(0).max(100),
});

async function upsertCountryDefault(req, res, next) {
  try {
    const data = countrySchema.parse(req.body);
    const code = data.countryCode.toUpperCase();
    const { rows } = await pool.query(
      `INSERT INTO vat_country_defaults (country_code, country_name, default_rate_percent)
       VALUES ($1,$2,$3)
       ON CONFLICT (country_code) DO UPDATE SET country_name = $2, default_rate_percent = $3
       RETURNING *`,
      [code, data.countryName, data.defaultRatePercent]
    );
    res.json({
      country: { countryCode: rows[0].country_code, countryName: rows[0].country_name, defaultRatePercent: Number(rows[0].default_rate_percent) },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteCountryDefault(req, res, next) {
  try {
    await pool.query(`DELETE FROM vat_country_defaults WHERE country_code = $1`, [req.params.countryCode.toUpperCase()]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ── Règles par code postal (admin) ───────────────────────────
async function listPostalRules(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM vat_postal_rules ORDER BY country_code, position, postal_prefix`);
    res.json({
      rules: rows.map((r) => ({
        id: r.id,
        countryCode: r.country_code,
        postalPrefix: r.postal_prefix,
        ratePercent: Number(r.rate_percent),
        label: r.label,
        position: r.position,
      })),
    });
  } catch (err) {
    next(err);
  }
}

const ruleSchema = z.object({
  countryCode: z.string().min(2).max(2),
  postalPrefix: z.string().min(1),
  ratePercent: z.number().min(0).max(100),
  label: z.string().optional(),
  position: z.number().int().optional(),
});

async function createPostalRule(req, res, next) {
  try {
    const data = ruleSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO vat_postal_rules (country_code, postal_prefix, rate_percent, label, position)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.countryCode.toUpperCase(), data.postalPrefix, data.ratePercent, data.label || null, data.position ?? 0]
    );
    res.status(201).json({ rule: rows[0] });
  } catch (err) {
    next(err);
  }
}

const updateRuleSchema = ruleSchema.partial();

async function updatePostalRule(req, res, next) {
  try {
    const data = updateRuleSchema.parse(req.body);
    const fields = [];
    const values = [];
    let i = 1;
    const map = { countryCode: "country_code", postalPrefix: "postal_prefix", ratePercent: "rate_percent", label: "label", position: "position" };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(key === "countryCode" ? data[key].toUpperCase() : data[key]);
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE vat_postal_rules SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: "Règle introuvable." });
    res.json({ rule: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deletePostalRule(req, res, next) {
  try {
    await pool.query(`DELETE FROM vat_postal_rules WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRate,
  listCountryDefaults,
  upsertCountryDefault,
  deleteCountryDefault,
  listPostalRules,
  createPostalRule,
  updatePostalRule,
  deletePostalRule,
};
