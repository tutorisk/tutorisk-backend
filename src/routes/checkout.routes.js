const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/checkout.controller");

const router = express.Router();

router.post("/create-session", requireAuth, ctrl.createCheckoutSession);

module.exports = router;
