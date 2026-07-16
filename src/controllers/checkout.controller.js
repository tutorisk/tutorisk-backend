const { z } = require("zod");
const Stripe = require("stripe");
const { pool } = require("../config/db");
const { generateTransferReference, bankDetails } = require("../utils/bankTransfer");
const { resolveVatRate, computeTtcCents } = require("../utils/vat");
const { getDiscountPercent } = require("./referral.controller");
const { getActivePromotion } = require("./promotions.controller");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createSessionSchema = z.object({
  moduleId: z.string().min(1),
  paymentMethod: z.enum(["card", "transfer"]).default("card"),
  postalCode: z.string().optional(),
  countryCode: z.string().length(2).optional(),
});

async function createCheckoutSession(req, res, next) {
  try {
    const { moduleId, paymentMethod, postalCode, countryCode } = createSessionSchema.parse(req.body);

    const { rows: moduleRows } = await pool.query(`SELECT * FROM modules WHERE id = $1`, [moduleId]);
    if (moduleRows.length === 0) return res.status(404).json({ error: "Module introuvable." });
    const mod = moduleRows[0];

    if (mod.price_cents <= 0) {
      return res.status(400).json({ error: "Ce module est gratuit, aucun paiement requis." });
    }

    const { rows: existing } = await pool.query(
      `SELECT 1 FROM enrollments WHERE user_id = $1 AND module_id = $2`,
      [req.user.id, moduleId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Vous êtes déjà inscrit à ce module." });
    }

    // Résout le taux de TVA à partir du code postal fourni (ou de celui déjà
    // enregistré sur le profil utilisateur), puis calcule le montant TTC.
    const { rows: userRows } = await pool.query(`SELECT postal_code, country_code, referred_by_code FROM users WHERE id = $1`, [req.user.id]);
    const effectiveCountry = countryCode || userRows[0]?.country_code || "FR";
    const effectivePostal = postalCode || userRows[0]?.postal_code || "";

    // Réduction ambassadeur : appliquée automatiquement si l'utilisateur a déjà
    // renseigné le code d'un parrain (une fois pour toutes à l'inscription ou
    // via /api/auth/referral-code), avant le calcul de la TVA.
    const referredByCode = userRows[0]?.referred_by_code || null;
    const referralDiscountPercent = referredByCode ? await getDiscountPercent() : 0;
    const baseHt = mod.price_cents;

    // Promotion temporaire éventuellement active sur ce module — s'applique
    // en premier sur le prix HT, puis la réduction ambassadeur s'applique sur
    // le prix déjà promotionné (les deux remises se cumulent).
    const promo = await getActivePromotion(moduleId);
    const promoDiscountPercent = promo ? Number(promo.discount_percent) : 0;
    const afterPromoHt = promoDiscountPercent > 0 ? Math.round(baseHt * (1 - promoDiscountPercent / 100)) : baseHt;
    const discountedHt = referralDiscountPercent > 0 ? Math.round(afterPromoHt * (1 - referralDiscountPercent / 100)) : afterPromoHt;

    const vat = await resolveVatRate(effectiveCountry, effectivePostal);
    const amountCentsTtc = computeTtcCents(discountedHt, vat.ratePercent);

    // Mémorise le code postal sur le profil pour les prochains achats, si fourni.
    if (postalCode) {
      await pool.query(`UPDATE users SET postal_code = $1, country_code = $2 WHERE id = $3`, [postalCode, effectiveCountry, req.user.id]);
    }

    if (paymentMethod === "card") {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: req.user.email,
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: amountCentsTtc,
              product_data: {
                name: mod.title,
                description: `${mod.description || ""} (TTC, TVA ${vat.ratePercent}% incluse${promoDiscountPercent > 0 ? `, promotion -${promoDiscountPercent}%` : ""}${referralDiscountPercent > 0 ? `, réduction ambassadeur ${referralDiscountPercent}%` : ""})`.trim(),
              },
            },
            quantity: 1,
          },
        ],
        metadata: { type: "module", userId: req.user.id, moduleId: mod.id },
        success_url: `${process.env.FRONTEND_URL}/paiement-reussi?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/paiement-annule`,
      });

      await pool.query(
        `INSERT INTO payments (user_id, module_id, stripe_session_id, amount_cents_ht, vat_rate_percent, amount_cents, currency, payment_method, status, referral_code_used, referral_discount_percent, promo_discount_percent)
         VALUES ($1,$2,$3,$4,$5,$6,'eur','card','pending',$7,$8,$9)`,
        [req.user.id, mod.id, session.id, discountedHt, vat.ratePercent, amountCentsTtc, referredByCode, referralDiscountPercent || null, promoDiscountPercent || null]
      );

      return res.json({ paymentMethod: "card", url: session.url, amountCentsHt: discountedHt, vatRatePercent: vat.ratePercent, amountCentsTtc, referralDiscountPercent, promoDiscountPercent, originalAmountCentsHt: baseHt });
    }

    // Paiement par virement : commande en attente, validation manuelle par l'administrateur
    // (voir admin.controller.js → validateTransfer), qui crée alors l'inscription au module.
    const transferReference = generateTransferReference("MD");
    await pool.query(
      `INSERT INTO payments (user_id, module_id, amount_cents_ht, vat_rate_percent, amount_cents, currency, payment_method, status, transfer_reference, referral_code_used, referral_discount_percent, promo_discount_percent)
       VALUES ($1,$2,$3,$4,$5,'eur','transfer','pending',$6,$7,$8,$9)`,
      [req.user.id, mod.id, discountedHt, vat.ratePercent, amountCentsTtc, transferReference, referredByCode, referralDiscountPercent || null, promoDiscountPercent || null]
    );

    res.json({
      paymentMethod: "transfer",
      transferReference,
      amountCentsHt: discountedHt,
      vatRatePercent: vat.ratePercent,
      amountCentsTtc,
      amountCents: amountCentsTtc,
      referralDiscountPercent,
      promoDiscountPercent,
      originalAmountCentsHt: baseHt,
      bankDetails: bankDetails(),
      instructions: "Merci d'effectuer le virement en indiquant impérativement la référence ci-dessus. Votre accès au module sera activé dès réception et validation par notre équipe (sous 2 à 3 jours ouvrés).",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createCheckoutSession };

