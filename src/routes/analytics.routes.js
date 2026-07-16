const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/analytics.controller");

const canView = [requireAuth, requireRole("admin", "pedagogue")];
const router = express.Router();

router.get("/overview",          ...canView, ctrl.platformOverview);
router.get("/modules",           ...canView, ctrl.allModulesOverview);
router.get("/modules/:moduleId", ...canView, ctrl.moduleAnalytics);

module.exports = router;
