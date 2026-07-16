const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/enrollments.controller");

const router = express.Router();

router.get("/me", requireAuth, ctrl.myEnrollments);
router.post("/free", requireAuth, ctrl.enrollFree);
router.post("/", requireAuth, requireRole("admin", "charge"), ctrl.assign);

module.exports = router;
