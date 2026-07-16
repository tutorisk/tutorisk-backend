const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/payments.controller");

const router = express.Router();

router.get("/me", requireAuth, ctrl.myPayments);
router.get("/:type/:id/receipt", requireAuth, ctrl.downloadReceipt);

module.exports = router;
