const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/tags.controller");

const canEdit = [requireAuth, requireRole("admin", "pedagogue")];
const router = express.Router();

router.get("/", ctrl.listAllTags);
router.get("/:moduleId", ctrl.getModuleTags);
router.put("/:moduleId", ...canEdit, ctrl.setModuleTags);
router.post("/:moduleId", ...canEdit, ctrl.addTag);
router.delete("/:moduleId/:tag", ...canEdit, ctrl.removeTag);

module.exports = router;
