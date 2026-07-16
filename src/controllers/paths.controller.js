const { z } = require("zod");
const { pool } = require("../config/db");
const { resolveVatRate, computeTtcCents } = require("../utils/vat");
const { sendEnrollmentEmail } = require("../utils/emailTemplates");

// ── Lecture publique ──────────────────────────────────────────

async function listPaths(req, res, next) {
  try {
    const isEditor = req.user && ["admin", "pedagogue"].includes(req.user.role);
    const { rows } = await pool.query(
      `SELECT lp.*,
         COUNT(DISTINCT lpm.module_id) AS module_count,
         pe.id IS NOT NULL AS is_enrolled
       FROM learning_paths lp
       LEFT JOIN learning_path_modules lpm ON lpm.path_id = lp.id
       LEFT JOIN path_enrollments pe ON pe.path_id = lp.id AND pe.user_id = $1
       WHERE ($2 OR lp.published = true)
       GROUP BY lp.id, pe.id
       ORDER BY lp.title`,
      [req.user?.id || null, isEditor]
    );
    res.json({
      paths: rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        priceCents: r.price_cents,
        published: r.published,
        moduleCount: Number(r.module_count),
        isEnrolled: r.is_enrolled,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function getPath(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM learning_paths WHERE id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Parcours introuvable." });
    const path = rows[0];

    const { rows: modRows } = await pool.query(
      `SELECT m.id, m.title, m.category, m.level, m.duration_min, m.price_cents, m.published,
              lpm.position, e.completed_at IS NOT NULL AS is_completed,
              e.id IS NOT NULL AS is_enrolled
       FROM learning_path_modules lpm
       JOIN modules m ON m.id = lpm.module_id
       LEFT JOIN enrollments e ON e.module_id = m.id AND e.user_id = $1
       WHERE lpm.path_id = $2
       ORDER BY lpm.position`,
      [req.user?.id || null, req.params.id]
    );

    // Progression globale
    const totalModules = modRows.length;
    const completedModules = modRows.filter((m) => m.is_completed).length;
    const isEnrolled = modRows.length > 0 && modRows.every((m) => m.is_enrolled);

    let vat = { ratePercent: 20 };
    if (req.user) {
      const { rows: uRows } = await pool.query(`SELECT postal_code, country_code FROM users WHERE id=$1`, [req.user.id]);
      vat = await resolveVatRate(uRows[0]?.country_code || "FR", uRows[0]?.postal_code || "");
    } else {
      vat = await resolveVatRate("FR", "");
    }

    res.json({
      path: {
        id: path.id,
        title: path.title,
        description: path.description,
        priceCents: path.price_cents,
        priceCentsTtc: computeTtcCents(path.price_cents, vat.ratePercent),
        vatRatePercent: vat.ratePercent,
        published: path.published,
        isEnrolled,
        progressPercent: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
        completedModules,
        totalModules,
      },
      modules: modRows.map((m) => ({
        id: m.id,
        title: m.title,
        category: m.category,
        level: m.level,
        durationMin: m.duration_min,
        position: m.position,
        isEnrolled: m.is_enrolled,
        isCompleted: m.is_completed,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── Gestion admin ─────────────────────────────────────────────

const pathSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().optional(),
  priceCents: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

async function createPath(req, res, next) {
  try {
    const data = pathSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO learning_paths (title, description, price_cents, published)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.title, data.description || null, data.priceCents ?? 0, data.published ?? false]
    );
    res.status(201).json({ path: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updatePath(req, res, next) {
  try {
    const data = pathSchema.partial().parse(req.body);
    const fields = []; const values = []; let i = 1;
    const map = { title: "title", description: "description", priceCents: "price_cents", published: "published" };
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) { fields.push(`${col} = $${i++}`); values.push(data[k]); }
    }
    if (!fields.length) return res.status(400).json({ error: "Aucune donnée." });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE learning_paths SET ${fields.join(",")} WHERE id = $${i} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: "Parcours introuvable." });
    res.json({ path: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deletePath(req, res, next) {
  try {
    await pool.query(`DELETE FROM learning_paths WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// PUT /api/paths/:id/modules — remplace la liste ordonnée des modules d'un parcours
async function setPathModules(req, res, next) {
  try {
    const { moduleIds } = z.object({ moduleIds: z.array(z.string()).max(50) }).parse(req.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM learning_path_modules WHERE path_id = $1`, [req.params.id]);
      for (let i = 0; i < moduleIds.length; i++) {
        await client.query(
          `INSERT INTO learning_path_modules (path_id, module_id, position) VALUES ($1,$2,$3)
           ON CONFLICT (path_id, module_id) DO UPDATE SET position = $3`,
          [req.params.id, moduleIds[i], i]
        );
      }
      await client.query("COMMIT");
      res.json({ ok: true, moduleCount: moduleIds.length });
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

// ── Inscription à un parcours ─────────────────────────────────

// POST /api/paths/:id/enroll — inscrit l'utilisateur à tous les modules
// du parcours (gratuit si price_cents = 0 ; sinon déclenche un paiement
// séparé — même logique que pour un module individuel).
async function enrollPath(req, res, next) {
  try {
    const { rows: pathRows } = await pool.query(
      `SELECT lp.*, lpm.module_id FROM learning_paths lp
       JOIN learning_path_modules lpm ON lpm.path_id = lp.id
       WHERE lp.id = $1 AND lp.published = true ORDER BY lpm.position`,
      [req.params.id]
    );
    if (!pathRows.length) return res.status(404).json({ error: "Parcours introuvable ou non publié." });
    const path = pathRows[0];

    if (path.price_cents > 0) {
      return res.status(400).json({
        error: "Ce parcours est payant — utilisez le flux de paiement.",
        priceCents: path.price_cents,
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Inscription au parcours
      await client.query(
        `INSERT INTO path_enrollments (user_id, path_id, source) VALUES ($1,$2,'free')
         ON CONFLICT (user_id, path_id) DO NOTHING`,
        [req.user.id, req.params.id]
      );
      // Inscription à chaque module du parcours
      for (const row of pathRows) {
        await client.query(
          `INSERT INTO enrollments (user_id, module_id, source, expires_at)
           VALUES ($1,$2,'assigned',NULL)
           ON CONFLICT (user_id, module_id) DO NOTHING`,
          [req.user.id, row.module_id]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    const { rows: modRows } = await pool.query(
      `SELECT m.title FROM learning_path_modules lpm JOIN modules m ON m.id=lpm.module_id WHERE lpm.path_id=$1`,
      [req.params.id]
    );
    sendEnrollmentEmail({
      to: req.user.email,
      userName: req.user.name,
      moduleTitle: `Parcours "${path.title}" (${modRows.length} formations)`,
    }).catch(() => {});

    res.json({ ok: true, moduleCount: pathRows.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPaths, getPath, createPath, updatePath, deletePath, setPathModules, enrollPath };
