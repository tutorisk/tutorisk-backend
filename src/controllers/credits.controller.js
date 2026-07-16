const { z } = require("zod");
const Stripe = require("stripe");
const { pool } = require("../config/db");
const { generateTransferReference, bankDetails } = require("../utils/bankTransfer");
const { resolveVatRate, computeTtcCents } = require("../utils/vat");
const { getDiscountPercent } = require("./referral.controller");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const purchaseSchema = z.object({
  packId: z.string().uuid(),
  paymentMethod: z.enum(["card", "transfer"]),
  postalCode: z.string().optional(),
  countryCode: z.string().length(2).optional(),
});

async function purchase(req, res, next) {
  try {
    const { packId, paymentMethod, postalCode, countryCode } = purchaseSchema.parse(req.body);

    const { rows: packRows } = await pool.query(`SELECT * FROM credit_packs WHERE id = $1 AND active = true`, [packId]);
    if (packRows.length === 0) return res.status(404).json({ error: "Lot de crédits introuvable." });
    const pack = packRows[0];

    const { rows: userRows } = await pool.query(`SELECT postal_code, country_code, referred_by_code FROM users WHERE id = $1`, [req.user.id]);
    const effectiveCountry = countryCode || userRows[0]?.country_code || "FR";
    const effectivePostal = postalCode || userRows[0]?.postal_code || "";

    const referredByCode = userRows[0]?.referred_by_code || null;
    const referralDiscountPercent = referredByCode ? await getDiscountPercent() : 0;
    const baseHt = pack.price_cents;
    const discountedHt = referralDiscountPercent > 0 ? Math.round(baseHt * (1 - referralDiscountPercent / 100)) : baseHt;

    const vat = await resolveVatRate(effectiveCountry, effectivePostal);
    const amountCentsTtc = computeTtcCents(discountedHt, vat.ratePercent);

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
                name: pack.name,
                description: `${pack.credits} crédits de formation (remise ${pack.discount_percent}%, TTC TVA ${vat.ratePercent}% incluse${referralDiscountPercent > 0 ? `, réduction ambassadeur ${referralDiscountPercent}%` : ""})`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: { type: "credit_pack", userId: req.user.id, packId: pack.id, credits: String(pack.credits) },
        success_url: `${process.env.FRONTEND_URL}/paiement-reussi?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/paiement-annule`,
      });

      await pool.query(
        `INSERT INTO credit_purchases (user_id, pack_id, credits, amount_cents_ht, vat_rate_percent, amount_cents, payment_method, status, stripe_session_id, referral_code_used, referral_discount_percent)
         VALUES ($1,$2,$3,$4,$5,$6,'card','pending',$7,$8,$9)`,
        [req.user.id, pack.id, pack.credits, discountedHt, vat.ratePercent, amountCentsTtc, session.id, referredByCode, referralDiscountPercent || null]
      );

      return res.json({ paymentMethod: "card", url: session.url, amountCentsHt: discountedHt, vatRatePercent: vat.ratePercent, amountCentsTtc, referralDiscountPercent, originalAmountCentsHt: baseHt });
    }

    // Paiement par virement : on crée la commande en attente et on renvoie les
    // coordonnées bancaires + la référence à utiliser. L'administrateur validera
    // manuellement à réception du virement (voir admin.controller.js).
    const transferReference = generateTransferReference("CR");
    const { rows } = await pool.query(
      `INSERT INTO credit_purchases (user_id, pack_id, credits, amount_cents_ht, vat_rate_percent, amount_cents, payment_method, status, transfer_reference, referral_code_used, referral_discount_percent)
       VALUES ($1,$2,$3,$4,$5,$6,'transfer','pending',$7,$8,$9) RETURNING *`,
      [req.user.id, pack.id, pack.credits, discountedHt, vat.ratePercent, amountCentsTtc, transferReference, referredByCode, referralDiscountPercent || null]
    );

    res.json({
      paymentMethod: "transfer",
      purchaseId: rows[0].id,
      transferReference,
      amountCentsHt: discountedHt,
      vatRatePercent: vat.ratePercent,
      amountCentsTtc,
      amountCents: amountCentsTtc,
      referralDiscountPercent,
      originalAmountCentsHt: baseHt,
      bankDetails: bankDetails(),
      instructions: "Merci d'effectuer le virement en indiquant impérativement la référence ci-dessus. Vos crédits seront ajoutés à votre compte dès réception et validation par notre équipe (sous 2 à 3 jours ouvrés).",
    });
  } catch (err) {
    next(err);
  }
}

async function myPurchases(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT cp.*, p.name AS pack_name FROM credit_purchases cp
       LEFT JOIN credit_packs p ON p.id = cp.pack_id
       WHERE cp.user_id = $1 ORDER BY cp.created_at DESC`,
      [req.user.id]
    );
    res.json({
      purchases: rows.map((r) => ({
        id: r.id,
        packName: r.pack_name,
        credits: r.credits,
        amountCentsHt: r.amount_cents_ht,
        vatRatePercent: Number(r.vat_rate_percent),
        amountCentsTtc: r.amount_cents,
        paymentMethod: r.payment_method,
        status: r.status,
        transferReference: r.transfer_reference,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { purchase, myPurchases };
