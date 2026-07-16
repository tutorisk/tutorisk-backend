const { pool } = require("../config/db");

// Détermine le taux de TVA applicable pour un pays + code postal donnés.
// Cherche la règle de code postal la plus spécifique (préfixe le plus long
// qui correspond), et retombe sur le taux par défaut du pays si aucune règle
// de code postal ne correspond.
async function resolveVatRate(countryCode = "FR", postalCode = "") {
  const country = (countryCode || "FR").toUpperCase();
  const postal = (postalCode || "").trim();

  if (postal) {
    const { rows } = await pool.query(
      `SELECT * FROM vat_postal_rules
       WHERE country_code = $1 AND $2 LIKE postal_prefix || '%'
       ORDER BY length(postal_prefix) DESC
       LIMIT 1`,
      [country, postal]
    );
    if (rows.length > 0) {
      return { ratePercent: Number(rows[0].rate_percent), source: "postal_rule", label: rows[0].label };
    }
  }

  const { rows: defaultRows } = await pool.query(
    `SELECT * FROM vat_country_defaults WHERE country_code = $1`,
    [country]
  );
  if (defaultRows.length > 0) {
    return { ratePercent: Number(defaultRows[0].default_rate_percent), source: "country_default", label: defaultRows[0].country_name };
  }

  // Aucune configuration trouvée pour ce pays : on ne devine pas un taux,
  // 0% par défaut pour éviter de surfacturer silencieusement un client.
  return { ratePercent: 0, source: "fallback", label: null };
}

// Calcule le montant TTC (en centimes) à partir d'un montant HT et d'un taux en %.
function computeTtcCents(amountCentsHt, ratePercent) {
  return Math.round(amountCentsHt * (1 + ratePercent / 100));
}

module.exports = { resolveVatRate, computeTtcCents };
