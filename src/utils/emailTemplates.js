const { sendMail } = require("./mailer");

const BRAND_HEADER = `
  <div style="background:#CC1515;padding:20px 24px;border-radius:10px 10px 0 0;">
    <span style="color:#fff;font-size:20px;font-weight:800;font-style:italic;">TutoRisk</span>
  </div>`;

const WRAP_START = `<div style="font-family:-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #EBEBEB;border-radius:10px;overflow:hidden;">${BRAND_HEADER}<div style="padding:24px;color:#1a1a1a;line-height:1.6;">`;
const WRAP_END = `</div><div style="padding:14px 24px;background:#FAFAFA;color:#999;font-size:11px;">TutoRisk — Formation santé & sécurité au travail</div></div>`;

async function sendEnrollmentEmail({ to, userName, moduleTitle }) {
  return sendMail({
    to,
    subject: `Accès activé — ${moduleTitle}`,
    html: `${WRAP_START}
      <p>Bonjour ${userName},</p>
      <p>Votre accès à la formation <strong>${moduleTitle}</strong> vient d'être activé. Vous pouvez dès à présent commencer ou poursuivre votre parcours depuis votre espace TutoRisk.</p>
      <p style="margin-top:20px;">Bonne formation,<br/>L'équipe TutoRisk</p>
    ${WRAP_END}`,
  });
}

async function sendModuleCompletedEmail({ to, userName, moduleTitle }) {
  return sendMail({
    to,
    subject: `Formation terminée — ${moduleTitle}`,
    html: `${WRAP_START}
      <p>Bonjour ${userName},</p>
      <p>Félicitations, vous avez terminé la formation <strong>${moduleTitle}</strong> 🎉</p>
      <p>Votre attestation est disponible au téléchargement depuis votre espace TutoRisk, sur la page de ce module.</p>
      <p style="margin-top:20px;">L'équipe TutoRisk</p>
    ${WRAP_END}`,
  });
}

async function sendCreditsAddedEmail({ to, userName, credits, newBalance }) {
  return sendMail({
    to,
    subject: `${credits} crédits ajoutés à votre compte`,
    html: `${WRAP_START}
      <p>Bonjour ${userName},</p>
      <p>Votre virement a bien été reçu et validé. <strong>${credits} crédits</strong> ont été ajoutés à votre compte.</p>
      <p>Nouveau solde : <strong>${newBalance} crédits</strong>.</p>
      <p style="margin-top:20px;">L'équipe TutoRisk</p>
    ${WRAP_END}`,
  });
}

module.exports = { sendEnrollmentEmail, sendModuleCompletedEmail, sendCreditsAddedEmail };
