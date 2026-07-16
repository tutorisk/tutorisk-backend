const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/admin.controller");
const reimbCtrl = require("../controllers/reimbursements.controller");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));
router.get("/users/search", ctrl.searchUserByEmail);
router.get("/users", ctrl.listUsers);
router.post("/users", ctrl.createUser);
router.put("/users/:id", ctrl.updateUser);
router.put("/users/:id/role", ctrl.updateUserRole);
router.delete("/users/:id", ctrl.deleteUser);
router.get("/users/:userId/enrollments", ctrl.listUserEnrollments);
router.put("/enrollments/:id/extend", ctrl.extendEnrollment);

router.get("/entreprises", ctrl.listEntreprises);
router.post("/entreprises", ctrl.createEntreprise);

router.get("/pending-transfers", ctrl.listPendingTransfers);
router.post("/pending-transfers/:type/:id/validate", ctrl.validateTransfer);
router.post("/pending-transfers/:type/:id/reject", ctrl.rejectTransfer);

router.get("/reimbursements", reimbCtrl.listAllReimbursements);
router.post("/reimbursements/:id/validate", reimbCtrl.validateReimbursement);
router.post("/reimbursements/:id/mark-paid", reimbCtrl.markReimbursementPaid);
router.post("/reimbursements/:id/reject", reimbCtrl.rejectReimbursement);

module.exports = router;
