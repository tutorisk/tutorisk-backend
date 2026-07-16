const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/promotions.controller");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", ctrl.listAll);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
