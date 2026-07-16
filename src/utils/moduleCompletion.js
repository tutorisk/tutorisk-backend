const { pool } = require("../config/db");
const { sendModuleCompletedEmail } = require("./emailTemplates");

// À appeler après avoir marqué un contenu comme terminé (vidéo visionnée ou
// QCM répondu). Vérifie si l'ensemble du module est désormais à 100%, et si
// c'est la première fois, enregistre la date de fin et envoie l'email de
// félicitations. Best-effort : ne lève jamais d'erreur bloquante.
async function checkAndHandleModuleCompletion({ userId, userName, userEmail, contentId }) {
  try {
    const { rows: moduleRows } = await pool.query(
      `SELECT ch.module_id FROM contents c JOIN chapters ch ON ch.id = c.chapter_id WHERE c.id = $1`,
      [contentId]
    );
    const moduleId = moduleRows[0]?.module_id;
    if (!moduleId) return;

    const { rows: progRows } = await pool.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE p.completed) AS completed
       FROM contents c
       JOIN chapters ch ON ch.id = c.chapter_id
       LEFT JOIN progress p ON p.content_id = c.id AND p.user_id = $1
       WHERE ch.module_id = $2`,
      [userId, moduleId]
    );
    const { total, completed } = progRows[0];
    if (Number(total) === 0 || Number(completed) !== Number(total)) return;

    const { rows: justCompleted } = await pool.query(
      `UPDATE enrollments SET completed_at = now()
       WHERE user_id = $1 AND module_id = $2 AND completed_at IS NULL
       RETURNING id`,
      [userId, moduleId]
    );
    if (justCompleted.length === 0) return; // déjà marqué terminé précédemment, pas de doublon d'email

    const { rows: modInfo } = await pool.query(`SELECT title FROM modules WHERE id = $1`, [moduleId]);
    if (userEmail) {
      sendModuleCompletedEmail({ to: userEmail, userName, moduleTitle: modInfo[0]?.title || moduleId }).catch(() => {});
    }
  } catch {
    // La détection de complétion ne doit jamais faire échouer l'action principale
    // (validation QCM, sauvegarde de progression vidéo) qui l'a déclenchée.
  }
}

module.exports = { checkAndHandleModuleCompletion };
