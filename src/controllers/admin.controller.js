const { z } = require("zod");
const { pool } = require("../config/db");
const { toPublicUser } = require("./auth.controller");
const { hashPassword } = require("../utils/password");
const { sendEnrollmentEmail, sendCreditsAddedEmail } = require("../utils/emailTemplates");
const { generateUniqueReferralCode } = require("../utils/referral");
const { creditAmbassadorCommission } = require("../utils/ambassadorCommission");

async function listUsers(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT u.*, e.name AS entreprise_name FROM users u
      LEFT JOIN entreprises e ON e.id = u.entreprise_id
      ORDER BY u.created_at DESC
    `);
    res.json({
      users: rows.map((r) => ({ ...toPublicUser(r), entrepriseName: r.entreprise_name })),
    });
  } catch (err) {
    next(err);
  }
}

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  role: z.enum(["admin", "pedagogue", "formateur", "charge", "apprenant"]),
  entrepriseId: z.string().uuid().optional().nullable(),
  forfaitCredits: z.number().int().min(0).optional().nullable(),
  postalCode: z.string().optional().nullable(),
});

async function createUser(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);
    const referralCode = await generateUniqueReferralCode();
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, entreprise_id, forfait_credits, postal_code, referral_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [data.name, data.email, passwordHash, data.role, data.entrepriseId || null, data.forfaitCredits ?? null, data.postalCode || null, referralCode]
    );
    res.status(201).json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(), // si fourni, réinitialise le mot de passe
  role: z.enum(["admin", "pedagogue", "formateur", "charge", "apprenant"]).optional(),
  entrepriseId: z.string().uuid().nullable().optional(),
  forfaitCredits: z.number().int().min(0).nullable().optional(),
  postalCode: z.string().nullable().optional(),
});

async function updateUser(req, res, next) {
  try {
    const data = updateUserSchema.parse(req.body);
    const fields = [];
    const values = [];
    let i = 1;

    if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
    if (data.email !== undefined) { fields.push(`email = $${i++}`); values.push(data.email); }
    if (data.role !== undefined) { fields.push(`role = $${i++}`); values.push(data.role); }
    if (data.entrepriseId !== undefined) { fields.push(`entreprise_id = $${i++}`); values.push(data.entrepriseId); }
    if (data.forfaitCredits !== undefined) { fields.push(`forfait_credits = $${i++}`); values.push(data.forfaitCredits); }
    if (data.postalCode !== undefined) { fields.push(`postal_code = $${i++}`); values.push(data.postalCode); }
    if (data.password) { fields.push(`password_hash = $${i++}`); values.push(await hashPassword(data.password)); }

    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

const updateRoleSchema = z.object({ role: z.enum(["admin", "pedagogue", "formateur", "charge", "apprenant"]) });

async function updateUserRole(req, res, next) {
  try {
    const { role } = updateRoleSchema.parse(req.body);
    const { rows } = await pool.query(`UPDATE users SET role = $1 WHERE id = $2 RETURNING *`, [role, req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
    }
    await pool.query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ── Entreprises (pour rattacher les comptes "charge" et "apprenant") ────
async function listEntreprises(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM entreprises ORDER BY name`);
    res.json({ entreprises: rows.map((r) => ({ id: r.id, name: r.name })) });
  } catch (err) {
    next(err);
  }
}

const entrepriseSchema = z.object({ name: z.string().min(2) });

async function createEntreprise(req, res, next) {
  try {
    const data = entrepriseSchema.parse(req.body);
    const { rows } = await pool.query(`INSERT INTO entreprises (name) VALUES ($1) RETURNING *`, [data.name]);
    res.status(201).json({ entreprise: { id: rows[0].id, name: rows[0].name } });
  } catch (err) {
    next(err);
  }
}

// ── Paiements par virement en attente de validation manuelle ────────────
// Regroupe les deux types de commande (achat de module / achat de crédits)
// pour donner à l'administrateur une vue unique des virements à rapprocher.
async function listPendingTransfers(req, res, next) {
  try {
    const { rows: moduleOrders } = await pool.query(
      `SELECT p.id, p.user_id, u.name AS user_name, u.email AS user_email,
              p.module_id, m.title AS module_title, p.amount_cents_ht, p.vat_rate_percent, p.amount_cents, p.transfer_reference, p.created_at
       FROM payments p
       JOIN users u ON u.id = p.user_id
       JOIN modules m ON m.id = p.module_id
       WHERE p.payment_method = 'transfer' AND p.status = 'pending'
       ORDER BY p.created_at`
    );
    const { rows: creditOrders } = await pool.query(
      `SELECT cp.id, cp.user_id, u.name AS user_name, u.email AS user_email,
              cp.credits, cp.amount_cents_ht, cp.vat_rate_percent, cp.amount_cents, cp.transfer_reference, cp.created_at
       FROM credit_purchases cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.payment_method = 'transfer' AND cp.status = 'pending'
       ORDER BY cp.created_at`
    );

    res.json({
      modulePayments: moduleOrders.map((r) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        moduleId: r.module_id,
        moduleTitle: r.module_title,
        amountCentsHt: r.amount_cents_ht,
        vatRatePercent: Number(r.vat_rate_percent),
        amountCentsTtc: r.amount_cents,
        transferReference: r.transfer_reference,
        createdAt: r.created_at,
      })),
      creditPurchases: creditOrders.map((r) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        credits: r.credits,
        amountCentsHt: r.amount_cents_ht,
        vatRatePercent: Number(r.vat_rate_percent),
        amountCentsTtc: r.amount_cents,
        transferReference: r.transfer_reference,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// type: "module" | "credit"
async function validateTransfer(req, res, next) {
  const { type, id } = req.params;
  if (!["module", "credit"].includes(type)) return res.status(400).json({ error: "Type de commande invalide." });

  const client = await pool.connect();
  let emailJob = null;
  let commissionJob = null;
  try {
    await client.query("BEGIN");

    if (type === "module") {
      const { rows } = await client.query(
        `UPDATE payments SET status = 'paid', validated_by = $1, validated_at = now()
         WHERE id = $2 AND payment_method = 'transfer' AND status = 'pending' RETURNING *`,
        [req.user.id, id]
      );
      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Commande introuvable ou déjà traitée." });
      }
      await client.query(
        `INSERT INTO enrollments (user_id, module_id, source) VALUES ($1,$2,'purchase')
         ON CONFLICT (user_id, module_id) DO NOTHING`,
        [rows[0].user_id, rows[0].module_id]
      );
      const { rows: userRows } = await client.query(`SELECT name, email FROM users WHERE id = $1`, [rows[0].user_id]);
      const { rows: modRows } = await client.query(`SELECT title FROM modules WHERE id = $1`, [rows[0].module_id]);
      if (userRows[0] && modRows[0]) {
        emailJob = () => sendEnrollmentEmail({ to: userRows[0].email, userName: userRows[0].name, moduleTitle: modRows[0].title });
      }
      if (rows[0].referral_code_used) {
        commissionJob = () => creditAmbassadorCommission({ referralCodeUsed: rows[0].referral_code_used, amountCentsHt: rows[0].amount_cents_ht });
      }
    } else {
      const { rows } = await client.query(
        `UPDATE credit_purchases SET status = 'paid', validated_by = $1, validated_at = now()
         WHERE id = $2 AND payment_method = 'transfer' AND status = 'pending' RETURNING *`,
        [req.user.id, id]
      );
      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Commande introuvable ou déjà traitée." });
      }
      const { rows: userRows } = await client.query(
        `UPDATE users SET forfait_credits = COALESCE(forfait_credits, 0) + $1 WHERE id = $2 RETURNING name, email, forfait_credits`,
        [rows[0].credits, rows[0].user_id]
      );
      if (userRows[0]) {
        emailJob = () => sendCreditsAddedEmail({ to: userRows[0].email, userName: userRows[0].name, credits: rows[0].credits, newBalance: userRows[0].forfait_credits });
      }
      if (rows[0].referral_code_used) {
        commissionJob = () => creditAmbassadorCommission({ referralCodeUsed: rows[0].referral_code_used, amountCentsHt: rows[0].amount_cents_ht });
      }
    }

    await client.query("COMMIT");
    if (emailJob) emailJob().catch(() => {});
    if (commissionJob) commissionJob().catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

async function rejectTransfer(req, res, next) {
  const { type, id } = req.params;
  if (!["module", "credit"].includes(type)) return res.status(400).json({ error: "Type de commande invalide." });
  try {
    const table = type === "module" ? "payments" : "credit_purchases";
    const { rows } = await pool.query(
      `UPDATE ${table} SET status = 'failed', validated_by = $1, validated_at = now()
       WHERE id = $2 AND payment_method = 'transfer' AND status = 'pending' RETURNING id`,
      [req.user.id, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Commande introuvable ou déjà traitée." });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users/search?email=... — recherche un utilisateur par email
// (utilisé par l'admin pour retrouver rapidement un apprenant et gérer ses accès).
async function searchUserByEmail(req, res, next) {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email manquant." });
    const { rows } = await pool.query(
      `SELECT id, name, email, role FROM users WHERE email ILIKE $1 ORDER BY name LIMIT 10`,
      [`%${email}%`]
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users/:userId/enrollments — liste les inscriptions d'un
// apprenant avec leur statut d'expiration, pour que l'admin puisse les gérer.
async function listUserEnrollments(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, m.title, m.category
       FROM enrollments e JOIN modules m ON m.id = e.module_id
       WHERE e.user_id = $1 ORDER BY e.created_at DESC`,
      [req.params.userId]
    );
    const now = new Date();
    res.json({
      enrollments: rows.map((r) => ({
        id: r.id,
        moduleId: r.module_id,
        title: r.title,
        category: r.category,
        source: r.source,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        expiresAt: r.expires_at,
        isExpired: r.expires_at !== null && new Date(r.expires_at) < now,
        extendedAt: r.extended_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

const extendSchema = z.object({
  // Nouvelle date d'expiration ISO, ou null explicite pour un accès illimité.
  expiresAt: z.string().datetime().nullable(),
});

// PUT /api/admin/enrollments/:id/extend — prolonge (ou rend illimité) l'accès
// d'un apprenant à un module précis, même après expiration.
async function extendEnrollment(req, res, next) {
  try {
    const { expiresAt } = extendSchema.parse(req.body);
    const { rows } = await pool.query(
      `UPDATE enrollments SET expires_at = $1, extended_by = $2, extended_at = now()
       WHERE id = $3 RETURNING *`,
      [expiresAt, req.user.id, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Inscription introuvable." });
    res.json({
      enrollment: {
        id: rows[0].id,
        expiresAt: rows[0].expires_at,
        extendedAt: rows[0].extended_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
  listEntreprises,
  createEntreprise,
  listPendingTransfers,
  validateTransfer,
  rejectTransfer,
  searchUserByEmail,
  listUserEnrollments,
  extendEnrollment,
};
