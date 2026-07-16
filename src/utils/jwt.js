const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email, entrepriseId: user.entrepriseId || null },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// Les jetons de rafraîchissement ne sont jamais stockés en clair en base :
// on conserve seulement leur empreinte SHA-256, comparée à la connexion suivante.
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
