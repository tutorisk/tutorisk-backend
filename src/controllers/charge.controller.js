const { z } = require("zod");
const { pool } = require("../config/db");
const { sendEnrollmentEmail } = require("../utils/emailTemplates");

// Un "chargé de formation" ne voit et ne gère que les apprenants rattachés à
// sa propre entreprise (même entreprise_id) — jamais l'ensemble des utilisateurs.

async function listCollaborators(req, res, next) {
  try {
    if (!req.user.entrepriseId) return res.json({ collaborators: [] });

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email,
        COUNT(DISTINCT e.id) AS enrollment_count,
        COUNT(DISTINCT e.id) FILTER (WHERE e.completed_at IS NOT NULL) AS completed_count,
        MAX(p.updated_at) AS last_activity
       FROM users u
       LEFT JOIN enrollments e ON e.user_id = u.id
       LEFT JOIN progress p ON p.user_id = u.id
       WHERE u.entreprise_id = $1 AND u.role = 'apprenant'
       GROUP BY u.id
       ORDER BY u.name`,
      [req.user.entrepriseId]
    );

    res.json({
      collaborators: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        enrollmentCount: Number(r.enrollment_count),
        completedCount: Number(r.completed_count),
        lastActivity: r.last_activity,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// Historique détaillé d'un collaborateur (vérifie qu'il appartient bien à la
// même entreprise que le "charge" qui consulte — pas d'accès croisé entre entreprises).
async function collaboratorHistory(req, res, next) {
  try {
    const { userId } = req.params;

    const { rows: userRows } = await pool.query(
      `SELECT id, name, email FROM users WHERE id = $1 AND entreprise_id = $2 AND role = 'apprenant'`,
      [userId, req.user.entrepriseId]
    );
    if (userRows.length === 0) return res.status(404).json({ error: "Collaborateur introuvable." });

    const { rows } = await pool.query(
      `SELECT e.module_id, e.source, e.created_at, e.completed_at, e.expires_at, m.title, m.category,
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
         FROM progress p JOIN contents c ON c.id = p.content_id JOIN chapters ch ON ch.id = c.chapter_id
         WHERE p.user_id = $1 AND p.completed = true
         GROUP BY ch.module_id
       ) prog ON prog.module_id = e.module_id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    );

    res.json({
      collaborator: userRows[0],
      enrollments: rows.map((r) => ({
        moduleId: r.module_id,
        title: r.title,
        category: r.category,
        source: r.source,
        enrolledAt: r.created_at,
        completedAt: r.completed_at,
        expiresAt: r.expires_at,
        isExpired: r.expires_at !== null && new Date(r.expires_at) < new Date(),
        progressPercent: r.total_count > 0 ? Math.round((r.completed_count / r.total_count) * 100) : 0,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// Résout un email vers un utilisateur de la même entreprise (apprenant uniquement).
async function resolveCollaborator(req, res, next) {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email manquant." });
    const { rows } = await pool.query(
      `SELECT id, name, email FROM users WHERE email = $1 AND entreprise_id = $2 AND role = 'apprenant'`,
      [email, req.user.entrepriseId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Aucun collaborateur trouvé avec cet email dans votre entreprise." });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

const bulkAssignSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(200),
  moduleId: z.string().min(1),
});

// Inscrit plusieurs collaborateurs (par email) à un module en une seule
// opération, en débitant les crédits du "charge" un par un. S'arrête dès que
// les crédits sont insuffisants, mais conserve les inscriptions déjà faites.
async function bulkAssign(req, res, next) {
  try {
    const data = bulkAssignSchema.parse(req.body);
    const results = { succeeded: [], failed: [] };

    const { rows: moduleRows } = await pool.query(`SELECT price_cents, title FROM modules WHERE id = $1`, [data.moduleId]);
    if (moduleRows.length === 0) return res.status(404).json({ error: "Module introuvable." });
    const requiredCredits = Math.ceil(moduleRows[0].price_cents / 100);
    const moduleTitle = moduleRows[0].title;

    for (const rawEmail of data.emails) {
      const email = rawEmail.trim().toLowerCase();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const { rows: userRows } = await client.query(
          `SELECT id, name FROM users WHERE email = $1 AND entreprise_id = $2 AND role = 'apprenant'`,
          [email, req.user.entrepriseId]
        );
        if (userRows.length === 0) {
          await client.query("ROLLBACK");
          results.failed.push({ email, reason: "Introuvable dans votre entreprise" });
          continue;
        }

        const { rows: chargeRows } = await client.query(`SELECT forfait_credits FROM users WHERE id = $1 FOR UPDATE`, [req.user.id]);
        const credits = chargeRows[0]?.forfait_credits ?? 0;
        if (credits < requiredCredits) {
          await client.query("ROLLBACK");
          results.failed.push({ email, reason: "Crédits insuffisants" });
          continue;
        }

        await client.query(`UPDATE users SET forfait_credits = forfait_credits - $1 WHERE id = $2`, [requiredCredits, req.user.id]);
        await client.query(
          `INSERT INTO enrollments (user_id, module_id, source) VALUES ($1,$2,'assigned') ON CONFLICT (user_id, module_id) DO NOTHING`,
          [userRows[0].id, data.moduleId]
        );

        await client.query("COMMIT");
        results.succeeded.push({ email, name: userRows[0].name });
        sendEnrollmentEmail({ to: email, userName: userRows[0].name, moduleTitle }).catch(() => {});
      } catch (err) {
        await client.query("ROLLBACK");
        results.failed.push({ email, reason: "Erreur technique" });
      } finally {
        client.release();
      }
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
}

// Export CSV du suivi de formation de l'entreprise (séparateur point-virgule,
// compatible Excel français).
async function exportCsv(req, res, next) {
  try {
    if (!req.user.entrepriseId) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      return res.send("Collaborateur;Email;Module;Statut;Progression;Date d'inscription;Date de fin\n");
    }

    const { rows } = await pool.query(
      `SELECT u.name AS user_name, u.email AS user_email, m.title, e.created_at, e.completed_at,
        COALESCE(prog.completed_count, 0) AS completed_count,
        COALESCE(total.total_count, 0) AS total_count
       FROM users u
       JOIN enrollments e ON e.user_id = u.id
       JOIN modules m ON m.id = e.module_id
       LEFT JOIN (
         SELECT ch.module_id, COUNT(*) AS total_count
         FROM contents c JOIN chapters ch ON ch.id = c.chapter_id
         GROUP BY ch.module_id
       ) total ON total.module_id = e.module_id
       LEFT JOIN (
         SELECT p.user_id, ch.module_id, COUNT(*) AS completed_count
         FROM progress p JOIN contents c ON c.id = p.content_id JOIN chapters ch ON ch.id = c.chapter_id
         WHERE p.completed = true
         GROUP BY p.user_id, ch.module_id
       ) prog ON prog.module_id = e.module_id AND prog.user_id = u.id
       WHERE u.entreprise_id = $1 AND u.role = 'apprenant'
       ORDER BY u.name, m.title`,
      [req.user.entrepriseId]
    );

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = ["Collaborateur;Email;Module;Statut;Progression;Date d'inscription;Date de fin"];
    for (const r of rows) {
      const percent = r.total_count > 0 ? Math.round((r.completed_count / r.total_count) * 100) : 0;
      const status = r.completed_at ? "Terminé" : percent > 0 ? "En cours" : "Non commencé";
      const enrolled = new Date(r.created_at).toLocaleDateString("fr-FR");
      const completed = r.completed_at ? new Date(r.completed_at).toLocaleDateString("fr-FR") : "";
      lines.push([esc(r.user_name), esc(r.user_email), esc(r.title), esc(status), esc(percent + "%"), esc(enrolled), esc(completed)].join(";"));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="suivi-formation-${new Date().toISOString().slice(0, 10)}.csv"`);
    // BOM UTF-8 pour qu'Excel affiche correctement les accents à l'ouverture
    res.send("\uFEFF" + lines.join("\n"));
  } catch (err) {
    next(err);
  }
}

module.exports = { listCollaborators, collaboratorHistory, resolveCollaborator, bulkAssign, exportCsv };
