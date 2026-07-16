const { z } = require("zod");
const { pool } = require("../config/db");

// Calcule le taux de réduction ambassadeur actuellement configuré.
async function getDiscountPercent() {
  const { rows } = await pool.query(`SELECT discount_percent FROM referral_settings WHERE id = 1`);
  return rows[0] ? Number(rows[0].discount_percent) : 5;
}

// Calcule le taux de commission ambassadeur actuellement configuré (15% par défaut).
async function getCommissionPercent() {
  const { rows } = await pool.query(`SELECT commission_percent FROM referral_settings WHERE id = 1`);
  return rows[0] ? Number(rows[0].commission_percent) : 15;
}

async function getReimbursementThresholdCents() {
  const { rows } = await pool.query(`SELECT reimbursement_threshold_cents FROM referral_settings WHERE id = 1`);
  return rows[0] ? Number(rows[0].reimbursement_threshold_cents) : 10000;
}

async function getSettings(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM referral_settings WHERE id = 1`);
    const s = rows[0];
    res.json({
      discountPercent: Number(s.discount_percent),
      commissionPercent: Number(s.commission_percent),
      reimbursementThresholdCents: Number(s.reimbursement_threshold_cents),
    });
  } catch (err) {
    next(err);
  }
}

const settingsSchema = z.object({
  discountPercent: z.number().min(0).max(100).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  reimbursementThresholdCents: z.number().int().min(0).optional(),
});

async function updateSettings(req, res, next) {
  try {
    const data = settingsSchema.parse(req.body);
    const fields = [];
    const values = [];
    let i = 1;
    const map = { discountPercent: "discount_percent", commissionPercent: "commission_percent", reimbursementThresholdCents: "reimbursement_threshold_cents" };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) { fields.push(`${col} = $${i++}`); values.push(data[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    await pool.query(`UPDATE referral_settings SET ${fields.join(", ")} WHERE id = 1`, values);
    await getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
}

// GET /api/referral/validate?code=XXXX — vérifie qu'un code existe (utilisé
// par le frontend pour afficher "Code de XXX appliqué" avant confirmation).
async function validateCode(req, res, next) {
  try {
    const code = String(req.query.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Code manquant." });
    const { rows } = await pool.query(`SELECT name FROM users WHERE referral_code = $1`, [code]);
    if (rows.length === 0) return res.status(404).json({ valid: false, error: "Code ambassadeur invalide." });
    const discountPercent = await getDiscountPercent();
    res.json({ valid: true, ownerName: rows[0].name, discountPercent });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings, validateCode, getDiscountPercent, getCommissionPercent, getReimbursementThresholdCents };
