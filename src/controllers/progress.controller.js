const { z } = require("zod");
const { pool } = require("../config/db");
const { checkAndHandleModuleCompletion } = require("../utils/moduleCompletion");

const updateSchema = z.object({
  contentId: z.string().uuid(),
  completed: z.boolean().optional(),
  watchedSeconds: z.number().int().min(0).optional(),
  // timeSpentSeconds : durée en secondes passée sur ce contenu dans cette session.
  // Envoyé par le frontend à la fermeture d'un doc/QCM/texte.
  timeSpentSeconds: z.number().int().min(0).optional(),
});

async function upsertProgress(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);

    // Pour les vidéos, time_spent_seconds = watched_seconds (position de lecture).
    // Pour les autres types, time_spent_seconds est envoyé directement.
    const rawTime = data.timeSpentSeconds ?? data.watchedSeconds ?? null;

    const { rows } = await pool.query(
      `INSERT INTO progress (user_id, content_id, completed, watched_seconds, time_spent_seconds, first_opened_at)
       VALUES ($1,$2,COALESCE($3,false),COALESCE($4,0),COALESCE($5,0),now())
       ON CONFLICT (user_id, content_id) DO UPDATE SET
         completed          = COALESCE($3, progress.completed),
         watched_seconds    = GREATEST(progress.watched_seconds, COALESCE($4, progress.watched_seconds)),
         time_spent_seconds = GREATEST(progress.time_spent_seconds, COALESCE($5, progress.time_spent_seconds)),
         first_opened_at    = COALESCE(progress.first_opened_at, now()),
         updated_at         = now()
       RETURNING *`,
      [req.user.id, data.contentId, data.completed ?? null, data.watchedSeconds ?? null, rawTime]
    );

    if (data.completed) {
      checkAndHandleModuleCompletion({
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        contentId: data.contentId,
      });
    }

    res.json({ progress: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function moduleProgress(req, res, next) {
  try {
    const { moduleId } = req.params;
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE p.completed) AS completed
       FROM contents c
       JOIN chapters ch ON ch.id = c.chapter_id
       LEFT JOIN progress p ON p.content_id = c.id AND p.user_id = $1
       WHERE ch.module_id = $2`,
      [req.user.id, moduleId]
    );
    const { total, completed } = rows[0];
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    res.json({ moduleId, total: Number(total), completed: Number(completed), percent });
  } catch (err) {
    next(err);
  }
}

module.exports = { upsertProgress, moduleProgress };
