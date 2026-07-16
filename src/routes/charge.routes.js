const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/charge.controller");

const router = express.Router();

router.use(requireAuth, requireRole("charge", "admin"));

router.get("/collaborators", ctrl.listCollaborators);
router.get("/collaborators/:userId/history", ctrl.collaboratorHistory);
router.get("/resolve", ctrl.resolveCollaborator);
router.post("/bulk-assign", ctrl.bulkAssign);
router.get("/export-csv", ctrl.exportCsv);

module.exports = router;
