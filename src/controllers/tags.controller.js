const { z } = require("zod");
const { pool } = require("../config/db");

// GET /api/tags — liste tous les tags distincts utilisés sur la plateforme
// (pour alimenter le filtre du catalogue et l'autocomplete de l'éditeur).
async function listAllTags(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT tag, COUNT(*) AS module_count
       FROM module_tags GROUP BY tag ORDER BY tag`
    );
    res.json({ tags: rows.map((r) => ({ tag: r.tag, moduleCount: Number(r.module_count) })) });
  } catch (err) {
    next(err);
  }
}

// GET /api/tags/:moduleId — tags d'un module spécifique
async function getModuleTags(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT tag FROM module_tags WHERE module_id = $1 ORDER BY tag`,
      [req.params.moduleId]
    );
    res.json({ tags: rows.map((r) => r.tag) });
  } catch (err) {
    next(err);
  }
}

const setTagsSchema = z.object({
  tags: z.array(
    z.string().min(1).max(50).regex(/^[a-zA-ZÀ-ÿ0-9\s\-&_]+$/, "Tag invalide")
  ).max(15),
});

// PUT /api/tags/:moduleId — remplace entièrement la liste des tags d'un module
async function setModuleTags(req, res, next) {
  try {
    const { tags } = setTagsSchema.parse(req.body);
    const normalized = [...new Set(tags.map((t) => t.trim().toLowerCase()))].filter(Boolean);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM module_tags WHERE module_id = $1`, [req.params.moduleId]);
      for (const tag of normalized) {
        await client.query(
          `INSERT INTO module_tags (module_id, tag) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [req.params.moduleId, tag]
        );
      }
      await client.query("COMMIT");
      res.json({ tags: normalized });
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

// POST /api/tags/:moduleId — ajoute un seul tag sans toucher aux autres
async function addTag(req, res, next) {
  try {
    const { tag } = z.object({ tag: z.string().min(1).max(50) }).parse(req.body);
    const normalized = tag.trim().toLowerCase();
    await pool.query(
      `INSERT INTO module_tags (module_id, tag) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.params.moduleId, normalized]
    );
    const { rows } = await pool.query(`SELECT tag FROM module_tags WHERE module_id = $1 ORDER BY tag`, [req.params.moduleId]);
    res.json({ tags: rows.map((r) => r.tag) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tags/:moduleId/:tag
async function removeTag(req, res, next) {
  try {
    await pool.query(
      `DELETE FROM module_tags WHERE module_id = $1 AND tag = $2`,
      [req.params.moduleId, req.params.tag]
    );
    const { rows } = await pool.query(`SELECT tag FROM module_tags WHERE module_id = $1 ORDER BY tag`, [req.params.moduleId]);
    res.json({ tags: rows.map((r) => r.tag) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAllTags, getModuleTags, setModuleTags, addTag, removeTag };
