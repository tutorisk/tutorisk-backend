const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const ctrl = require("../controllers/auth.controller");

const router = express.Router();

// Limite les tentatives de connexion/inscription pour freiner le brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, merci de réessayer dans quelques minutes." },
});

router.post("/register", authLimiter, optionalAuth, ctrl.register);
router.post("/login", authLimiter, ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", requireAuth, ctrl.me);
router.put("/me", requireAuth, ctrl.updateMe);
router.delete("/me", requireAuth, ctrl.deleteAccount);
router.get("/me/export", requireAuth, ctrl.exportMyData);
router.post("/referral-code", requireAuth, ctrl.applyReferralCode);

module.exports = router;
