const crypto = require("crypto");

// Génère une référence courte et lisible à faire figurer sur le virement,
// pour que l'administrateur puisse rapprocher le virement reçu de la commande.
function generateTransferReference(prefix) {
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${code}`;
}

function bankDetails() {
  return {
    accountHolder: process.env.BANK_ACCOUNT_HOLDER || "TutoRisk SAS",
    iban: process.env.BANK_IBAN || "FR76 XXXX XXXX XXXX XXXX XXXX XXX",
    bic: process.env.BANK_BIC || "XXXXXXXX",
    bankName: process.env.BANK_NAME || "Votre banque",
  };
}

module.exports = { generateTransferReference, bankDetails };
