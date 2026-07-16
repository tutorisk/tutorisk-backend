const { z } = require("zod");
const { pool } = require("../config/db");
const { sendMail } = require("../utils/mailer");

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subject: z.enum(["formation-presentielle","conseil-audit","formation-enligne","pcs-pics","autre"]).optional(),
  message: z.string().min(10).max(4000),
  phone: z.string().max(20).optional(),
});

async function submitContact(req, res, next) {
  try {
    const data = contactSchema.parse(req.body);

    // Enregistrement en base (table créée à la volée si besoin)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        phone TEXT,
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message, phone) VALUES ($1,$2,$3,$4,$5)`,
      [data.name, data.email, data.subject || null, data.message, data.phone || null]
    );

    const subjectLabels = {
      "formation-presentielle": "Formation présentielle",
      "conseil-audit": "Conseil & audit",
      "formation-enligne": "Formation en ligne",
      "pcs-pics": "PCS / PICS",
      "autre": "Autre demande",
    };

    // Notification par email
    await sendMail({
      to: process.env.CONTACT_EMAIL || "contact@tutorisk.com",
      subject: `[TutoRisk] Nouveau message de ${data.name} — ${subjectLabels[data.subject] || "Demande"}`,
      text: `
Nom : ${data.name}
Email : ${data.email}
Téléphone : ${data.phone || "Non renseigné"}
Sujet : ${subjectLabels[data.subject] || "Non précisé"}

Message :
${data.message}
      `.trim(),
    }).catch(() => { /* non bloquant */ });

    res.json({ ok: true, message: "Votre message a bien été envoyé. Nous vous répondrons sous 48h." });
  } catch (err) {
    next(err);
  }
}

// Liste des messages (admin uniquement)
async function listMessages(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100`
    ).catch(() => ({ rows: [] }));
    res.json({ messages: rows });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await pool.query(`UPDATE contact_messages SET read=true WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitContact, listMessages, markRead };
