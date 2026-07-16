const { z } = require("zod");
const { pool } = require("../config/db");
const { generateAmbassadorInvoicePdf } = require("../utils/ambassadorInvoice");
const { getReimbursementThresholdCents } = require("./referral.controller");
const { sendMail } = require("../utils/mailer");

// ── Côté ambassadeur ──────────────────────────────────────────

// GET /api/referral/balance — solde actuel + éligibilité au remboursement.
async function getBalance(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT ambassador_balance_cents FROM users WHERE id = $1`, [req.user.id]);
    const balanceCents = rows[0]?.ambassador_balance_cents || 0;
    const thresholdCents = await getReimbursementThresholdCents();

    const { rows: activeRows } = await pool.query(
      `SELECT * FROM ambassador_reimbursements WHERE user_id = $1 AND status IN ('pending','validated') ORDER BY requested_at DESC LIMIT 1`,
      [req.user.id]
    );

    res.json({
      balanceCents,
      thresholdCents,
      canRequestReimbursement: balanceCents >= thresholdCents && activeRows.length === 0,
      activeRequest: activeRows[0]
        ? {
            id: activeRows[0].id,
            amountCents: activeRows[0].amount_cents,
            status: activeRows[0].status,
            requestedAt: activeRows[0].requested_at,
            deadlineAt: activeRows[0].deadline_at,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/referral/invoice?accountHolder=...&iban=... — génère un aperçu PDF
// de la facture à venir, AVANT validation de la demande (pour que
// l'ambassadeur puisse la consulter avant de s'engager).
async function previewInvoice(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT ambassador_balance_cents FROM users WHERE id = $1`, [req.user.id]);
    const balanceCents = rows[0]?.ambassador_balance_cents || 0;
    const thresholdCents = await getReimbursementThresholdCents();
    if (balanceCents < thresholdCents) {
      return res.status(409).json({ error: `Solde insuffisant — ${(thresholdCents / 100).toFixed(0)} € minimum requis.` });
    }

    const accountHolder = String(req.query.accountHolder || req.user.name);
    const iban = String(req.query.iban || "");

    const pdfBuffer = await generateAmbassadorInvoicePdf({
      invoiceNumber: `APERCU-${Date.now()}`,
      issuerName: req.user.name,
      issuerEmail: req.user.email,
      accountHolder,
      iban: iban || "(à renseigner)",
      amountCents: balanceCents,
      date: new Date(),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="facture-apercu.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

const requestSchema = z.object({
  accountHolder: z.string().min(2),
  iban: z.string().min(10),
});

// POST /api/referral/reimbursement — valide et soumet la demande de
// remboursement (fige le montant au solde actuel).
async function requestReimbursement(req, res, next) {
  try {
    const data = requestSchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: userRows } = await client.query(`SELECT ambassador_balance_cents FROM users WHERE id = $1 FOR UPDATE`, [req.user.id]);
      const balanceCents = userRows[0]?.ambassador_balance_cents || 0;
      const thresholdCents = await getReimbursementThresholdCents();

      if (balanceCents < thresholdCents) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: `Solde insuffisant — ${(thresholdCents / 100).toFixed(0)} € minimum requis.` });
      }

      const { rows: activeRows } = await client.query(
        `SELECT 1 FROM ambassador_reimbursements WHERE user_id = $1 AND status IN ('pending','validated')`,
        [req.user.id]
      );
      if (activeRows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Une demande de remboursement est déjà en cours." });
      }

      const invoiceNumber = `AMB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const { rows } = await client.query(
        `INSERT INTO ambassador_reimbursements (user_id, amount_cents, invoice_number, account_holder, iban, status)
         VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
        [req.user.id, balanceCents, invoiceNumber, data.accountHolder, data.iban]
      );

      await client.query("COMMIT");
      res.status(201).json({
        reimbursement: {
          id: rows[0].id,
          amountCents: rows[0].amount_cents,
          invoiceNumber: rows[0].invoice_number,
          status: rows[0].status,
          requestedAt: rows[0].requested_at,
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/referral/reimbursement/:id/invoice — télécharge la facture
// définitive associée à une demande déjà soumise.
async function downloadRequestInvoice(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name, u.email FROM ambassador_reimbursements r JOIN users u ON u.id = r.user_id
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Demande introuvable." });
    const r = rows[0];

    const pdfBuffer = await generateAmbassadorInvoicePdf({
      invoiceNumber: r.invoice_number,
      issuerName: r.name,
      issuerEmail: r.email,
      accountHolder: r.account_holder,
      iban: r.iban,
      amountCents: r.amount_cents,
      date: r.requested_at,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="facture-${r.invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

// GET /api/referral/reimbursements — historique des demandes de l'ambassadeur.
async function myReimbursements(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ambassador_reimbursements WHERE user_id = $1 ORDER BY requested_at DESC`,
      [req.user.id]
    );
    res.json({
      reimbursements: rows.map((r) => ({
        id: r.id,
        amountCents: r.amount_cents,
        invoiceNumber: r.invoice_number,
        status: r.status,
        requestedAt: r.requested_at,
        validatedAt: r.validated_at,
        deadlineAt: r.deadline_at,
        paidAt: r.paid_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── Côté administrateur ──────────────────────────────────────

async function listAllReimbursements(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS user_name, u.email AS user_email
       FROM ambassador_reimbursements r JOIN users u ON u.id = r.user_id
       ORDER BY r.requested_at DESC`
    );
    res.json({
      reimbursements: rows.map((r) => ({
        id: r.id,
        userName: r.user_name,
        userEmail: r.user_email,
        amountCents: r.amount_cents,
        invoiceNumber: r.invoice_number,
        accountHolder: r.account_holder,
        iban: r.iban,
        status: r.status,
        requestedAt: r.requested_at,
        validatedAt: r.validated_at,
        deadlineAt: r.deadline_at,
        paidAt: r.paid_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/reimbursements/:id/validate — l'admin accepte la demande
// et s'engage à réaliser le virement sous 45 jours (juste informatif/tracé,
// le virement reste un acte manuel hors plateforme).
async function validateReimbursement(req, res, next) {
  try {
    const { rows } = await pool.query(
      `UPDATE ambassador_reimbursements
       SET status = 'validated', validated_by = $1, validated_at = now(), deadline_at = now() + interval '45 days'
       WHERE id = $2 AND status = 'pending' RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Demande introuvable ou déjà traitée." });
    res.json({ ok: true, deadlineAt: rows[0].deadline_at });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/reimbursements/:id/mark-paid — l'admin confirme avoir
// réalisé le virement : le solde correspondant est débité et l'ambassadeur
// est notifié par email.
async function markReimbursementPaid(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE ambassador_reimbursements SET status = 'paid', paid_at = now()
       WHERE id = $1 AND status = 'validated' RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Demande introuvable ou pas encore validée." });
    }
    const reimb = rows[0];

    // Le crédit facturé est annulé (débité du solde) une fois le virement réalisé.
    const { rows: userRows } = await client.query(
      `UPDATE users SET ambassador_balance_cents = GREATEST(0, ambassador_balance_cents - $1) WHERE id = $2 RETURNING name, email`,
      [reimb.amount_cents, reimb.user_id]
    );

    await client.query("COMMIT");

    if (userRows[0]) {
      sendMail({
        to: userRows[0].email,
        subject: "Votre virement de commission ambassadeur a été lancé",
        html: `<div style="font-family:-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #EBEBEB;border-radius:10px;overflow:hidden;">
          <div style="background:#CC1515;padding:20px 24px;"><span style="color:#fff;font-size:20px;font-weight:800;font-style:italic;">TutoRisk</span></div>
          <div style="padding:24px;color:#1a1a1a;line-height:1.6;">
            <p>Bonjour ${userRows[0].name},</p>
            <p>Le virement de votre commission ambassadeur, d'un montant de <strong>${(reimb.amount_cents / 100).toFixed(2)} €</strong> (facture ${reimb.invoice_number}), vient d'être lancé.</p>
            <p>Selon votre banque, il peut prendre quelques jours ouvrés pour apparaître sur votre compte.</p>
            <p style="margin-top:20px;">Merci pour votre engagement,<br/>L'équipe TutoRisk</p>
          </div>
        </div>`,
      }).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

async function rejectReimbursement(req, res, next) {
  try {
    const { rows } = await pool.query(
      `UPDATE ambassador_reimbursements SET status = 'rejected'
       WHERE id = $1 AND status IN ('pending','validated') RETURNING id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Demande introuvable ou déjà traitée." });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBalance,
  previewInvoice,
  requestReimbursement,
  downloadRequestInvoice,
  myReimbursements,
  listAllReimbursements,
  validateReimbursement,
  markReimbursementPaid,
  rejectReimbursement,
};
