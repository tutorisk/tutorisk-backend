const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");
const { signVideoToken, verifyVideoToken } = require("../utils/videoToken");

const MEDIA_ROOT = process.env.PROTECTED_MEDIA_DIR || path.join(__dirname, "..", "..", "media");

// ── Vérifie que l'utilisateur a accès au contenu vidéo demandé ──
async function userCanAccessContent(user, contentId) {
  if (!user) return false;
  if (["admin", "pedagogue", "formateur"].includes(user.role)) return true;

  const { rows } = await pool.query(
    `SELECT e.expires_at FROM contents c
     JOIN chapters ch ON ch.id = c.chapter_id
     JOIN enrollments e ON e.module_id = ch.module_id AND e.user_id = $1
     WHERE c.id = $2`,
    [user.id, contentId]
  );
  if (rows.length === 0) return false;
  // Inscription expirée et non prolongée par l'administrateur (expires_at NULL = illimité)
  if (rows[0].expires_at !== null && new Date(rows[0].expires_at) < new Date()) return false;
  return true;
}

// POST /api/videos/:contentId/url — émet une URL de lecture signée, valable quelques minutes.
async function getSignedUrl(req, res, next) {
  try {
    const { contentId } = req.params;

    const { rows } = await pool.query(`SELECT * FROM contents WHERE id = $1 AND type = 'video'`, [contentId]);
    if (rows.length === 0) return res.status(404).json({ error: "Vidéo introuvable." });

    const allowed = await userCanAccessContent(req.user, contentId);
    if (!allowed) return res.status(403).json({ error: "Vous n'avez pas accès à cette formation." });

    const token = signVideoToken({ contentId, userId: req.user.id });
    res.json({ url: `/stream/${contentId}?token=${token}`, expiresIn: process.env.VIDEO_TOKEN_TTL || "10m" });
  } catch (err) {
    next(err);
  }
}

// GET /stream/:contentId?token=... — diffuse le fichier vidéo avec support des Range requests
// (nécessaire pour la lecture progressive / le déplacement dans la vidéo côté navigateur).
// Cette route n'utilise PAS de header Authorization (la balise <video> ne peut pas en envoyer) :
// la sécurité repose entièrement sur le jeton signé et limité dans le temps présent dans l'URL.
async function streamVideo(req, res) {
  const { contentId } = req.params;
  const { token } = req.query;

  if (!token) return res.status(401).json({ error: "Jeton manquant." });

  let payload;
  try {
    payload = verifyVideoToken(token);
  } catch {
    return res.status(401).json({ error: "Lien de lecture expiré ou invalide. Rechargez la page." });
  }
  if (payload.contentId !== contentId) {
    return res.status(403).json({ error: "Jeton non valide pour ce contenu." });
  }

  const { rows } = await pool.query(`SELECT * FROM contents WHERE id = $1 AND type = 'video'`, [contentId]);
  if (rows.length === 0 || !rows[0].file_path) return res.status(404).end();

  const filePath = path.join(MEDIA_ROOT, rows[0].file_path);
  // Empêche toute évasion du dossier protégé via un file_path malicieux (path traversal)
  if (!filePath.startsWith(MEDIA_ROOT)) return res.status(400).end();

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return res.status(404).json({ error: "Fichier vidéo introuvable sur le serveur." });
  }

  const fileSize = stat.size;
  const range = req.headers.range;

  // Empêche la mise en cache du flux et limite l'enregistrement facile par le navigateur
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Disposition", "inline");

  if (!range) {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    });
    return fs.createReadStream(filePath).pipe(res);
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
  const chunkSize = end - start + 1;

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": "video/mp4",
  });
  fs.createReadStream(filePath, { start, end }).pipe(res);
}

module.exports = { getSignedUrl, streamVideo };
