const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/progress.controller");

const router = express.Router();

router.post("/", requireAuth, ctrl.upsertProgress);
router.get("/module/:moduleId", requireAuth, ctrl.moduleProgress);

module.exports = router;
