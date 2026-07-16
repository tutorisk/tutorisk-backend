const { z } = require("zod");
const { pool } = require("../config/db");

async function list(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM entreprises ORDER BY name`);
    res.json({ entreprises: rows.map((r) => ({ id: r.id, name: r.name })) });
  } catch (err) {
    next(err);
  }
}

const createSchema = z.object({ name: z.string().min(2) });

async function create(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const { rows } = await pool.query(`INSERT INTO entreprises (name) VALUES ($1) RETURNING *`, [data.name]);
    res.status(201).json({ entreprise: { id: rows[0].id, name: rows[0].name } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
