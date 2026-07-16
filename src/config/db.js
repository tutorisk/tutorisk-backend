const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("⚠️  DATABASE_URL non défini — vérifiez votre fichier .env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Active SSL automatiquement en production (ex: hébergeurs gérés type Render/Heroku/RDS)
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Erreur inattendue sur le pool PostgreSQL", err);
});

module.exports = { pool };
