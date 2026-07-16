const express = require("express");
const multer = require("multer");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/banners.controller");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.get("/", ctrl.listForPage);
router.get("/:id/image", ctrl.serveImage);

router.get("/admin/all", requireAuth, requireRole("admin"), ctrl.listAll);
router.post("/admin", requireAuth, requireRole("admin"), ctrl.create);
router.put("/admin/:id", requireAuth, requireRole("admin"), ctrl.update);
router.delete("/admin/:id", requireAuth, requireRole("admin"), ctrl.remove);
router.post("/admin/:id/image", requireAuth, requireRole("admin"), upload.single("file"), ctrl.uploadImage);
router.delete("/admin/:id/image", requireAuth, requireRole("admin"), ctrl.removeImage);

module.exports = router;
