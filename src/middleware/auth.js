const { verifyAccessToken } = require("../utils/jwt");

function getTokenFromHeader(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

// Exige un jeton d'accès valide — sinon 401.
function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: "Authentification requise." });
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name, email: payload.email, entrepriseId: payload.entrepriseId || null };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Jeton invalide ou expiré." });
  }
}

// Ne bloque pas si absent, mais attache req.user si le jeton est valide.
// Utile pour des routes publiques qui personnalisent la réponse si connecté.
function optionalAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name, email: payload.email, entrepriseId: payload.entrepriseId || null };
  } catch (err) {
    // jeton invalide silencieusement ignoré sur les routes optionnelles
  }
  next();
}

// Factory de middleware de contrôle d'accès par rôle.
// Usage : requireRole('admin', 'pedagogue')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentification requise." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé pour ce rôle." });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
