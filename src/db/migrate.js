require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const client = await pool.connect();
  try {
    console.log("→ Application du schéma...");
    await client.query(sql);
    console.log("✓ Schéma appliqué avec succès.");
  } catch (err) {
    console.error("✗ Échec de la migration :", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
