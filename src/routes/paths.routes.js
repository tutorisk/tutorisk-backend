const express = require("express");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/paths.controller");

const canEdit = [requireAuth, requireRole("admin", "pedagogue")];
const router = express.Router();

router.get("/", optionalAuth, ctrl.listPaths);
router.get("/:id", optionalAuth, ctrl.getPath);

router.post("/", ...canEdit, ctrl.createPath);
router.put("/:id", ...canEdit, ctrl.updatePath);
router.delete("/:id", requireAuth, requireRole("admin"), ctrl.deletePath);
router.put("/:id/modules", ...canEdit, ctrl.setPathModules);

router.post("/:id/enroll", requireAuth, ctrl.enrollPath);

module.exports = router;
