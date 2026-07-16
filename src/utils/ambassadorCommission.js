const { pool } = require("../config/db");
const { getCommissionPercent } = require("../controllers/referral.controller");

// À appeler uniquement lorsqu'un paiement passe au statut "paid" (jamais sur
// une commande encore "pending"), pour éviter de créditer une commission sur
// un virement qui ne sera peut-être jamais reçu.
//
// referralCodeUsed : le code que l'acheteur a utilisé (colonne référence sur
// la commande), amountCentsHt : le montant HT réellement payé par l'acheteur
// (après réduction ambassadeur et promotion éventuelles, mais hors TVA — la
// TVA collectée n'est pas un revenu, elle ne doit donc pas entrer dans le
// calcul de la commission).
async function creditAmbassadorCommission({ referralCodeUsed, amountCentsHt }) {
  if (!referralCodeUsed || !amountCentsHt) return;
  try {
    const { rows: ownerRows } = await pool.query(`SELECT id, name, email FROM users WHERE referral_code = $1`, [referralCodeUsed]);
    if (ownerRows.length === 0) return; // code orphelin (compte supprimé entre-temps) — on n'échoue pas le paiement pour autant

    const commissionPercent = await getCommissionPercent();
    const commissionCents = Math.round(amountCentsHt * (commissionPercent / 100));
    if (commissionCents <= 0) return;

    await pool.query(`UPDATE users SET ambassador_balance_cents = ambassador_balance_cents + $1 WHERE id = $2`, [
      commissionCents,
      ownerRows[0].id,
    ]);
  } catch {
    // Le crédit de commission ne doit jamais faire échouer la confirmation du paiement principal.
  }
}

module.exports = { creditAmbassadorCommission };
