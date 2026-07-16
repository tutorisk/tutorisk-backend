const jwt = require("jsonwebtoken");

// Jeton de courte durée, lié à un contenu et un utilisateur précis.
// Ce n'est pas un DRM (pas de chiffrement du flux ni de licence) : il s'agit
// d'une protection par URL signée — empêche le partage de lien et l'accès
// direct au fichier, sans nécessiter de fournisseur DRM tiers.
function signVideoToken({ contentId, userId }) {
  return jwt.sign({ contentId, userId }, process.env.VIDEO_SIGNING_SECRET, {
    expiresIn: process.env.VIDEO_TOKEN_TTL || "10m",
  });
}

function verifyVideoToken(token) {
  return jwt.verify(token, process.env.VIDEO_SIGNING_SECRET);
}

module.exports = { signVideoToken, verifyVideoToken };
