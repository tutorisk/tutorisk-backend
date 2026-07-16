const { z } = require("zod");
const { pool } = require("../config/db");
const { hashPassword, verifyPassword } = require("../utils/password");
const { generateUniqueReferralCode } = require("../utils/referral");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/jwt");

const REFRESH_COOKIE_NAME = "tutorisk_refresh";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // En production, frontend et backend sont sur des sous-domaines différents
  // (ex: tutorisk-frontend.onrender.com / tutorisk-backend.onrender.com) :
  // le cookie doit alors être "None" pour être envoyé sur les requêtes cross-site,
  // ce qui exige aussi secure:true (HTTPS obligatoire, fourni automatiquement par Render).
  // En local, frontend et backend sont tous deux sur "localhost" (même site au sens
  // de la spec SameSite), donc "lax" suffit et évite d'exiger HTTPS en développement.
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

const CURRENT_TERMS_VERSION = "1.0"; // à incrémenter à chaque mise à jour des CGU/politique de confidentialité

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  role: z.enum(["apprenant", "charge", "formateur", "pedagogue", "admin"]).optional(),
  referralCode: z.string().trim().toUpperCase().optional(),
  // RGPD Art. 7 — consentement explicite obligatoire
  consentAccepted: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter la politique de confidentialité pour créer un compte." }) }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
    entrepriseId: row.entreprise_id,
    forfaitCredits: row.forfait_credits,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    referralCode: row.referral_code,
    referredByCode: row.referred_by_code,
    ambassadorBalanceCents: row.ambassador_balance_cents || 0,
    consentAcceptedAt: row.consent_accepted_at,
    termsVersion: row.terms_version,
  };
}

async function issueSession(res, userRow) {
  const user = toPublicUser(userRow);
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '7 days')`,
    [user.id, hashToken(refreshToken)]
  );

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  return { user, accessToken };
}

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);
    // Seul un admin peut créer un compte admin/pédagogue/formateur via cette route publique :
    // par sécurité, l'inscription libre est toujours "apprenant" sauf si appelée par un admin authentifié.
    const role = req.user?.role === "admin" && data.role ? data.role : "apprenant";
    const referralCode = await generateUniqueReferralCode();

    // Si un code ambassadeur est fourni, on vérifie qu'il existe réellement
    // avant de l'enregistrer — sinon on l'ignore silencieusement plutôt que
    // de bloquer l'inscription pour une faute de frappe sur ce champ facultatif.
    let referredByCode = null;
    if (data.referralCode) {
      const { rows: ownerRows } = await pool.query(`SELECT 1 FROM users WHERE referral_code = $1`, [data.referralCode]);
      if (ownerRows.length > 0) referredByCode = data.referralCode;
    }

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, referral_code, referred_by_code, consent_accepted_at, terms_version)
       VALUES ($1,$2,$3,$4,$5,$6,now(),$7) RETURNING *`,
      [data.name, data.email, passwordHash, role, referralCode, referredByCode, CURRENT_TERMS_VERSION]
    );

    const { user, accessToken } = await issueSession(res, rows[0]);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [data.email]);
    const userRow = rows[0];

    // Comparaison toujours exécutée même si l'utilisateur n'existe pas (évite les attaques par timing)
    const validPassword = userRow
      ? await verifyPassword(data.password, userRow.password_hash)
      : await verifyPassword(data.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidi");

    if (!userRow || !validPassword) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const { user, accessToken } = await issueSession(res, userRow);
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Aucune session active." });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: "Session expirée, merci de vous reconnecter." });
    }

    const tokenHash = hashToken(token);
    const { rows: tokenRows } = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND user_id = $2 AND revoked = false AND expires_at > now()`,
      [tokenHash, payload.sub]
    );
    if (tokenRows.length === 0) {
      return res.status(401).json({ error: "Session révoquée, merci de vous reconnecter." });
    }

    // Rotation : on révoque l'ancien jeton et on en émet un nouveau
    await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE id = $1`, [tokenRows[0].id]);

    const { rows: userRows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [payload.sub]);
    if (userRows.length === 0) return res.status(401).json({ error: "Utilisateur introuvable." });

    const { user, accessToken } = await issueSession(res, userRows[0]);
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [hashToken(token)]);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    if (rows.length === 0 || rows[0].anonymized_at) {
      // Compte supprimé ou inexistant — on révoque aussi le cookie
      res.clearCookie("tutorisk_refresh", { path: "/" });
      return res.status(401).json({ error: "Ce compte n'existe plus." });
    }
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

const applyReferralSchema = z.object({ referralCode: z.string().trim().toUpperCase().min(1) });

// Permet à un utilisateur déjà inscrit de renseigner un code ambassadeur après
// coup — une seule fois (s'il en a déjà un, la demande est refusée), et jamais
// avec son propre code (auto-parrainage impossible).
async function applyReferralCode(req, res, next) {
  try {
    const { referralCode } = applyReferralSchema.parse(req.body);

    const { rows: meRows } = await pool.query(`SELECT referral_code, referred_by_code FROM users WHERE id = $1`, [req.user.id]);
    if (meRows[0].referred_by_code) {
      return res.status(409).json({ error: "Un code ambassadeur a déjà été appliqué à votre compte." });
    }
    if (meRows[0].referral_code === referralCode) {
      return res.status(400).json({ error: "Vous ne pouvez pas utiliser votre propre code." });
    }

    const { rows: ownerRows } = await pool.query(`SELECT 1 FROM users WHERE referral_code = $1`, [referralCode]);
    if (ownerRows.length === 0) {
      return res.status(404).json({ error: "Code ambassadeur invalide." });
    }

    const { rows } = await pool.query(`UPDATE users SET referred_by_code = $1 WHERE id = $2 RETURNING *`, [referralCode, req.user.id]);
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

const updateMeSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  postalCode: z.string().max(20).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères.").optional(),
});

// Permet à un utilisateur de modifier lui-même son nom, son code postal, et
// son mot de passe (en confirmant l'ancien) — sans passer par l'administrateur.
async function updateMe(req, res, next) {
  try {
    const data = updateMeSchema.parse(req.body);

    // Sécurité : un compte déjà pseudonymisé ne doit pas pouvoir être
    // "restauré" via cette route.
    const { rows: check } = await pool.query(`SELECT anonymized_at FROM users WHERE id = $1`, [req.user.id]);
    if (!check.length || check[0].anonymized_at) return res.status(401).json({ error: "Ce compte n'existe plus." });

    if (data.newPassword) {
      if (!data.currentPassword) return res.status(400).json({ error: "Mot de passe actuel requis pour le modifier." });
      const { rows: meRows } = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
      const valid = await verifyPassword(data.currentPassword, meRows[0].password_hash);
      if (!valid) return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    const fields = [];
    const values = [];
    let i = 1;
    if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
    if (data.postalCode !== undefined) { fields.push(`postal_code = $${i++}`); values.push(data.postalCode || null); }
    if (data.newPassword) { fields.push(`password_hash = $${i++}`); values.push(await hashPassword(data.newPassword)); }

    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    values.push(req.user.id);
    const { rows } = await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

// ── RGPD Art. 17 — Droit à l'effacement ─────────────────────
// Pseudonymisation plutôt que suppression dure : les données d'identification
// personnelle sont remplacées par des valeurs anonymes, mais les lignes sont
// conservées pour maintenir l'intégrité référentielle des paiements, journaux
// financiers et attestations (obligation légale de conservation 10 ans,
// Art. L123-22 Code de commerce français).
async function deleteAccount(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const anon = `deleted_${req.user.id.slice(0, 8)}`;
    await client.query(
      `UPDATE users SET
         name           = $1,
         email          = $2,
         password_hash  = '',
         postal_code    = NULL,
         referral_code  = NULL,
         referred_by_code = NULL,
         ambassador_balance_cents = 0,
         anonymized_at  = now(),
         deletion_requested_at = now()
       WHERE id = $3`,
      [`[Compte supprimé]`, `${anon}@deleted.invalid`, req.user.id]
    );

    // Invalide toutes les sessions actives (cookies de rafraîchissement)
    await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [req.user.id]);
    // Supprime les inscriptions et la progression (données pédagogiques personnelles)
    await client.query(`DELETE FROM enrollments WHERE user_id = $1`, [req.user.id]);
    await client.query(`DELETE FROM progress WHERE user_id = $1`, [req.user.id]);

    await client.query("COMMIT");
    res.clearCookie("tutorisk_refresh", { path: "/", httpOnly: true });
    res.json({ ok: true, message: "Votre compte a été supprimé et vos données personnelles anonymisées." });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

// ── RGPD Art. 20 — Droit à la portabilité ────────────────────
// Exporte toutes les données personnelles de l'utilisateur dans un format
// structuré (JSON), lisible par machine, directement téléchargeable.
async function exportMyData(req, res, next) {
  try {
    const { rows: userRows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    const u = userRows[0];

    const { rows: enrollments } = await pool.query(
      `SELECT e.module_id, m.title, e.source, e.created_at, e.completed_at, e.expires_at
       FROM enrollments e JOIN modules m ON m.id = e.module_id
       WHERE e.user_id = $1 ORDER BY e.created_at`,
      [req.user.id]
    );

    const { rows: payments } = await pool.query(
      `SELECT m.title, p.amount_cents_ht, p.vat_rate_percent, p.amount_cents,
              p.payment_method, p.status, p.created_at
       FROM payments p JOIN modules m ON m.id = p.module_id
       WHERE p.user_id = $1 ORDER BY p.created_at`,
      [req.user.id]
    );

    const { rows: credits } = await pool.query(
      `SELECT credits, amount_cents_ht, amount_cents, payment_method, status, created_at
       FROM credit_purchases WHERE user_id = $1 ORDER BY created_at`,
      [req.user.id]
    );

    const { rows: reimbursements } = await pool.query(
      `SELECT amount_cents, invoice_number, status, requested_at, paid_at
       FROM ambassador_reimbursements WHERE user_id = $1 ORDER BY requested_at`,
      [req.user.id]
    );

    const export_data = {
      export_date: new Date().toISOString(),
      platform: "TutoRisk LCMS",
      gdpr_basis: "Art. 20 RGPD — droit à la portabilité des données",
      profile: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        postalCode: u.postal_code,
        countryCode: u.country_code,
        createdAt: u.created_at,
        consentAcceptedAt: u.consent_accepted_at,
        termsVersion: u.terms_version,
      },
      enrollments,
      payments,
      credit_purchases: credits,
      ambassador_reimbursements: reimbursements,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="mes-donnees-tutorisk-${new Date().toISOString().slice(0,10)}.json"`);
    res.send(JSON.stringify(export_data, null, 2));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me, applyReferralCode, updateMe, deleteAccount, exportMyData, toPublicUser, CURRENT_TERMS_VERSION };
