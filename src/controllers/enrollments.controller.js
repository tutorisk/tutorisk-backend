const { z } = require("zod");
const { pool } = require("../config/db");
const { sendEnrollmentEmail } = require("../utils/emailTemplates");

async function myEnrollments(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, m.title, m.category, m.duration_min, m.level,
        COALESCE(prog.completed_count, 0) AS completed_count,
        COALESCE(total.total_count, 0) AS total_count
       FROM enrollments e
       JOIN modules m ON m.id = e.module_id
       LEFT JOIN (
         SELECT ch.module_id, COUNT(*) AS total_count
         FROM contents c JOIN chapters ch ON ch.id = c.chapter_id
         GROUP BY ch.module_id
       ) total ON total.module_id = e.module_id
       LEFT JOIN (
         SELECT ch.module_id, COUNT(*) AS completed_count
         FROM progress p
         JOIN contents c ON c.id = p.content_id
         JOIN chapters ch ON ch.id = c.chapter_id
         WHERE p.user_id = $1 AND p.completed = true
         GROUP BY ch.module_id
       ) prog ON prog.module_id = e.module_id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );

    res.json({
      enrollments: rows.map((r) => ({
        moduleId: r.module_id,
        title: r.title,
        category: r.category,
        durationMin: r.duration_min,
        level: r.level,
        source: r.source,
        progressPercent: r.total_count > 0 ? Math.round((r.completed_count / r.total_count) * 100) : 0,
        expiresAt: r.expires_at,
        isExpired: r.expires_at !== null && new Date(r.expires_at) < new Date(),
      })),
    });
  } catch (err) {
    next(err);
  }
}

const assignSchema = z.object({ userId: z.string().uuid(), moduleId: z.string().min(1) });

// Affecte un module à un apprenant (admin, ou chargé de formation pour ses collaborateurs).
// Pour un "charge", décrémente son forfait de crédits selon le prix HT du module
// (1 crédit = 1 € HT de formation — ex. un module à 59 € HT coûte 59 crédits).
async function assign(req, res, next) {
  try {
    const data = assignSchema.parse(req.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: moduleRows } = await client.query(`SELECT price_cents, title FROM modules WHERE id = $1`, [data.moduleId]);
      if (moduleRows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Module introuvable." });
      }
      const isFree = moduleRows[0].price_cents <= 0;
      const requiredCredits = isFree ? 0 : Math.ceil(moduleRows[0].price_cents / 100);

      if (!isFree && req.user.role === "charge") {
        const { rows: chargeRows } = await client.query(
          `SELECT forfait_credits FROM users WHERE id = $1 FOR UPDATE`,
          [req.user.id]
        );
        const credits = chargeRows[0]?.forfait_credits ?? 0;
        if (credits < requiredCredits) {
          await client.query("ROLLBACK");
          return res.status(402).json({ error: `Crédits insuffisants : ${requiredCredits} crédits requis, ${credits} disponibles.` });
        }
        await client.query(`UPDATE users SET forfait_credits = forfait_credits - $1 WHERE id = $2`, [requiredCredits, req.user.id]);
      }

      await client.query(
        `INSERT INTO enrollments (user_id, module_id, source, expires_at)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id, module_id) DO NOTHING`,
        [data.userId, data.moduleId, isFree ? 'free' : 'assigned', isFree ? null : undefined]
      );

      const { rows: learnerRows } = await client.query(`SELECT name, email FROM users WHERE id = $1`, [data.userId]);
      const { rows: modRows } = await client.query(`SELECT title FROM modules WHERE id = $1`, [data.moduleId]);

      await client.query("COMMIT");
      if (learnerRows[0] && modRows[0]) {
        sendEnrollmentEmail({ to: learnerRows[0].email, userName: learnerRows[0].name, moduleTitle: modRows[0].title }).catch(() => {});
      }
      res.status(201).json({ ok: true, creditsSpent: req.user.role === "charge" ? requiredCredits : 0 });
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

module.exports = { myEnrollments, assign, enrollFree };

const enrollFreeSchema = z.object({ moduleId: z.string().min(1) });

// POST /api/enrollments/free — permet à n'importe quel utilisateur connecté
// de s'auto-inscrire instantanément à un module dont le prix est à 0€ HT,
// sans passer par Stripe ni par un virement.
async function enrollFree(req, res, next) {
  try {
    const data = enrollFreeSchema.parse(req.body);

    const { rows: moduleRows } = await pool.query(`SELECT id, title, price_cents FROM modules WHERE id = $1`, [data.moduleId]);
    if (moduleRows.length === 0) return res.status(404).json({ error: "Module introuvable." });
    if (moduleRows[0].price_cents > 0) {
      return res.status(400).json({ error: "Ce module n'est pas gratuit — utilisez le parcours d'achat habituel." });
    }

    const { rows: existing } = await pool.query(
      `SELECT 1 FROM enrollments WHERE user_id = $1 AND module_id = $2`,
      [req.user.id, data.moduleId]
    );
    if (existing.length > 0) return res.status(409).json({ error: "Vous êtes déjà inscrit à ce module." });

    await pool.query(
      `INSERT INTO enrollments (user_id, module_id, source, expires_at) VALUES ($1,$2,'free',NULL)`,
      [req.user.id, data.moduleId]
    );

    sendEnrollmentEmail({ to: req.user.email, userName: req.user.name, moduleTitle: moduleRows[0].title }).catch(() => {});
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
