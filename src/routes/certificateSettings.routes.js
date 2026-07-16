const express = require("express");
const multer = require("multer");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/certificateSettings.controller");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", ctrl.getSettings);
router.put("/", ctrl.updateText);

router.post("/stamp", upload.single("file"), ctrl.uploadImage("stamp"));
router.delete("/stamp", ctrl.removeImage("stamp"));
router.get("/stamp/preview", ctrl.previewImage("stamp"));

router.post("/signature", upload.single("file"), ctrl.uploadImage("signature"));
router.delete("/signature", ctrl.removeImage("signature"));
router.get("/signature/preview", ctrl.previewImage("signature"));

module.exports = router;
