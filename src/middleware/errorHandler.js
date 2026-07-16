// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (err.name === "ZodError") {
    return res.status(400).json({ error: "Données invalides.", details: err.errors });
  }
  if (err.code === "23505") {
    // violation de contrainte unique PostgreSQL
    return res.status(409).json({ error: "Cette ressource existe déjà." });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.publicMessage || "Erreur interne du serveur." });
}

module.exports = { errorHandler };
