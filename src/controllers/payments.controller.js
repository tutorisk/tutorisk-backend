const { pool } = require("../config/db");
const { generateReceiptPdf } = require("../utils/receipt");

// Historique complet des paiements de l'utilisateur connecté (achats de
// modules + achats de lots de crédits), unifié et trié par date.
async function myPayments(req, res, next) {
  try {
    const { rows: moduleRows } = await pool.query(
      `SELECT p.id, p.module_id, m.title, p.amount_cents_ht, p.vat_rate_percent, p.amount_cents,
              p.payment_method, p.status, p.created_at, p.referral_discount_percent, p.promo_discount_percent
       FROM payments p JOIN modules m ON m.id = p.module_id
       WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    const { rows: creditRows } = await pool.query(
      `SELECT cp.id, cp.credits, cp.amount_cents_ht, cp.vat_rate_percent, cp.amount_cents,
              cp.payment_method, cp.status, cp.created_at, cp.referral_discount_percent
       FROM credit_purchases cp WHERE cp.user_id = $1 ORDER BY cp.created_at DESC`,
      [req.user.id]
    );

    const payments = [
      ...moduleRows.map((r) => ({
        type: "module",
        id: r.id,
        label: r.title,
        amountCentsHt: r.amount_cents_ht,
        vatRatePercent: Number(r.vat_rate_percent),
        amountCentsTtc: r.amount_cents,
        paymentMethod: r.payment_method,
        status: r.status,
        referralDiscountPercent: r.referral_discount_percent ? Number(r.referral_discount_percent) : 0,
        promoDiscountPercent: r.promo_discount_percent ? Number(r.promo_discount_percent) : 0,
        createdAt: r.created_at,
      })),
      ...creditRows.map((r) => ({
        type: "credit",
        id: r.id,
        label: `${r.credits} crédits`,
        amountCentsHt: r.amount_cents_ht,
        vatRatePercent: Number(r.vat_rate_percent),
        amountCentsTtc: r.amount_cents,
        paymentMethod: r.payment_method,
        status: r.status,
        referralDiscountPercent: r.referral_discount_percent ? Number(r.referral_discount_percent) : 0,
        createdAt: r.created_at,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ payments });
  } catch (err) {
    next(err);
  }
}

// GET /api/payments/:type/:id/receipt — génère un reçu PDF pour un paiement
// payé (carte ou virement validé). type = "module" | "credit".
async function downloadReceipt(req, res, next) {
  try {
    const { type, id } = req.params;
    if (!["module", "credit"].includes(type)) return res.status(400).json({ error: "Type invalide." });

    const table = type === "module" ? "payments" : "credit_purchases";
    const { rows } = await pool.query(
      `SELECT * FROM ${table} WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Paiement introuvable." });
    const payment = rows[0];
    if (payment.status !== "paid") return res.status(409).json({ error: "Ce paiement n'est pas encore validé." });

    let label;
    if (type === "module") {
      const { rows: modRows } = await pool.query(`SELECT title FROM modules WHERE id = $1`, [payment.module_id]);
      label = modRows[0]?.title || payment.module_id;
    } else {
      label = `${payment.credits} crédits de formation`;
    }

    const pdfBuffer = await generateReceiptPdf({
      receiptNumber: `TR-${type.toUpperCase()}-${id.slice(0, 8).toUpperCase()}`,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      label,
      amountCentsHt: payment.amount_cents_ht,
      vatRatePercent: Number(payment.vat_rate_percent),
      amountCentsTtc: payment.amount_cents,
      paymentMethod: payment.payment_method,
      date: payment.created_at,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="recu-${id.slice(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { myPayments, downloadReceipt };
