const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/referral.controller");
const reimbCtrl = require("../controllers/reimbursements.controller");

const router = express.Router();

router.get("/validate", ctrl.validateCode);
router.get("/settings", requireAuth, requireRole("admin"), ctrl.getSettings);
router.put("/settings", requireAuth, requireRole("admin"), ctrl.updateSettings);

router.get("/balance", requireAuth, reimbCtrl.getBalance);
router.get("/invoice", requireAuth, reimbCtrl.previewInvoice);
router.post("/reimbursement", requireAuth, reimbCtrl.requestReimbursement);
router.get("/reimbursement/:id/invoice", requireAuth, reimbCtrl.downloadRequestInvoice);
router.get("/reimbursements", requireAuth, reimbCtrl.myReimbursements);

module.exports = router;
