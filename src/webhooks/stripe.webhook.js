const Stripe = require("stripe");
const { pool } = require("../config/db");
const { sendEnrollmentEmail, sendCreditsAddedEmail } = require("../utils/emailTemplates");
const { creditAmbassadorCommission } = require("../utils/ambassadorCommission");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handleStripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    // req.body doit être le Buffer brut (voir middleware express.raw() dans les routes)
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Signature Stripe invalide :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const meta = session.metadata || {};

      if (meta.type === "credit_pack" && meta.userId && meta.credits) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const { rows: paidRows } = await client.query(
            `UPDATE credit_purchases
             SET status = 'paid', stripe_payment_intent = $1
             WHERE stripe_session_id = $2
             RETURNING referral_code_used, amount_cents_ht`,
            [session.payment_intent, session.id]
          );

          // COALESCE permet de créditer même un compte sans forfait initial (NULL → 0 + crédits)
          const { rows: userRows } = await client.query(
            `UPDATE users SET forfait_credits = COALESCE(forfait_credits, 0) + $1 WHERE id = $2 RETURNING name, email, forfait_credits`,
            [Number(meta.credits), meta.userId]
          );

          await client.query("COMMIT");
          // eslint-disable-next-line no-console
          console.log(`✓ Crédits ajoutés — utilisateur ${meta.userId}, +${meta.credits} crédits`);

          if (userRows[0]) {
            sendCreditsAddedEmail({
              to: userRows[0].email,
              userName: userRows[0].name,
              credits: Number(meta.credits),
              newBalance: userRows[0].forfait_credits,
            }).catch(() => {});
          }
          if (paidRows[0]?.referral_code_used) {
            creditAmbassadorCommission({ referralCodeUsed: paidRows[0].referral_code_used, amountCentsHt: paidRows[0].amount_cents_ht }).catch(() => {});
          }
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      } else if (meta.userId && meta.moduleId) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const { rows: paidRows } = await client.query(
            `UPDATE payments
             SET status = 'paid', stripe_payment_intent = $1
             WHERE stripe_session_id = $2
             RETURNING referral_code_used, amount_cents_ht`,
            [session.payment_intent, session.id]
          );

          // Idempotence : ON CONFLICT évite un doublon si Stripe redélivre l'événement
          await client.query(
            `INSERT INTO enrollments (user_id, module_id, source)
             VALUES ($1,$2,'purchase')
             ON CONFLICT (user_id, module_id) DO NOTHING`,
            [meta.userId, meta.moduleId]
          );

          await client.query("COMMIT");
          // eslint-disable-next-line no-console
          console.log(`✓ Paiement confirmé et inscription créée — utilisateur ${meta.userId}, module ${meta.moduleId}`);

          const { rows: userRows } = await pool.query(`SELECT name, email FROM users WHERE id = $1`, [meta.userId]);
          const { rows: modRows } = await pool.query(`SELECT title FROM modules WHERE id = $1`, [meta.moduleId]);
          if (userRows[0] && modRows[0]) {
            sendEnrollmentEmail({ to: userRows[0].email, userName: userRows[0].name, moduleTitle: modRows[0].title }).catch(() => {});
          }
          if (paidRows[0]?.referral_code_used) {
            creditAmbassadorCommission({ referralCodeUsed: paidRows[0].referral_code_used, amountCentsHt: paidRows[0].amount_cents_ht }).catch(() => {});
          }
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await pool.query(`UPDATE payments SET status = 'failed' WHERE stripe_session_id = $1`, [session.id]);
      await pool.query(`UPDATE credit_purchases SET status = 'failed' WHERE stripe_session_id = $1`, [session.id]);
    }

    res.json({ received: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Erreur de traitement du webhook Stripe :", err);
    // On répond 200 quand même pour éviter que Stripe ne renvoie indéfiniment
    // un événement qu'on a déjà partiellement traité ; l'erreur est loguée pour investigation.
    res.status(200).json({ received: true, processedWithError: true });
  }
}

module.exports = { handleStripeWebhook };
