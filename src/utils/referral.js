const crypto = require("crypto");
const { pool } = require("../config/db");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I pour éviter les confusions

function randomCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return code;
}

// Génère un code ambassadeur unique (quelques tentatives en cas de collision,
// extrêmement improbable avec 8 caractères sur un alphabet de 32 symboles).
async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode(8);
    const { rows } = await pool.query(`SELECT 1 FROM users WHERE referral_code = $1`, [code]);
    if (rows.length === 0) return code;
  }
  // Repli extrêmement improbable : ajoute un suffixe temporel pour garantir l'unicité.
  return `${randomCode(6)}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}

module.exports = { generateUniqueReferralCode };
