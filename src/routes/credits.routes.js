const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/credits.controller");

const router = express.Router();

// Réservé aux chargés de formation (et admin, pour tester/gérer) : ce sont eux
// qui détiennent un forfait de crédits à recharger.
router.post("/purchase", requireAuth, requireRole("charge", "admin"), ctrl.purchase);
router.get("/me", requireAuth, requireRole("charge", "admin"), ctrl.myPurchases);

module.exports = router;
