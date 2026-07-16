const nodemailer = require("nodemailer");

let transporter = null;
let initialized = false;

function getTransporter() {
  if (initialized) return transporter;
  initialized = true;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // eslint-disable-next-line no-console
    console.warn(
      "⚠️  SMTP non configuré (SMTP_HOST/SMTP_USER/SMTP_PASS manquants dans .env) — " +
        "les emails seront simplement affichés dans ce terminal au lieu d'être envoyés."
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

// Envoi best-effort : une erreur d'envoi d'email ne doit jamais faire échouer
// l'opération métier (paiement, inscription...) qui l'a déclenché.
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    // eslint-disable-next-line no-console
    console.log(`\n✉️  [EMAIL NON ENVOYÉ — SMTP non configuré]\nÀ : ${to}\nSujet : ${subject}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`);
    return { sent: false, reason: "smtp_not_configured" };
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || `TutoRisk <no-reply@tutorisk.com>`, to, subject, html });
    return { sent: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("✗ Échec d'envoi d'email :", err.message);
    return { sent: false, reason: "send_error" };
  }
}

module.exports = { sendMail };
