const express = require("express");
const { handleStripeWebhook } = require("../webhooks/stripe.webhook");

const router = express.Router();

// IMPORTANT : ce middleware express.raw() doit s'appliquer ICI, avant tout express.json()
// global, car Stripe exige le corps brut (non parsé) pour vérifier la signature HMAC.
// Voir server.js : cette route est montée avant app.use(express.json()).
router.post("/", express.raw({ type: "application/json" }), handleStripeWebhook);

module.exports = router;
