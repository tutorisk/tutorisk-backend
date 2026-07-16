const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/vat.controller");

const router = express.Router();

router.get("/rate", ctrl.getRate);

router.get("/countries", requireAuth, requireRole("admin"), ctrl.listCountryDefaults);
router.put("/countries", requireAuth, requireRole("admin"), ctrl.upsertCountryDefault);
router.delete("/countries/:countryCode", requireAuth, requireRole("admin"), ctrl.deleteCountryDefault);

router.get("/postal-rules", requireAuth, requireRole("admin"), ctrl.listPostalRules);
router.post("/postal-rules", requireAuth, requireRole("admin"), ctrl.createPostalRule);
router.put("/postal-rules/:id", requireAuth, requireRole("admin"), ctrl.updatePostalRule);
router.delete("/postal-rules/:id", requireAuth, requireRole("admin"), ctrl.deletePostalRule);

module.exports = router;
