const express = require("express");
const multer = require("multer");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/modules.controller");
const uploadCtrl = require("../controllers/upload.controller");
const { importCsv } = require("../controllers/csv.controller");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });
const uploadCsv = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const canEdit = [requireAuth, requireRole("admin", "pedagogue")];
const router = express.Router();

router.get("/", optionalAuth, ctrl.list);
router.get("/:id", optionalAuth, ctrl.detail);
router.get("/:id/certificate", requireAuth, ctrl.getCertificate);

router.post("/", ...canEdit, ctrl.createModule);
router.put("/:id", ...canEdit, ctrl.updateModule);
router.delete("/:id", requireAuth, requireRole("admin"), ctrl.deleteModule);
router.post("/:id/publish", ...canEdit, ctrl.togglePublished);
router.post("/:id/duplicate", ...canEdit, ctrl.duplicateModule);

router.post("/:moduleId/chapters", ...canEdit, ctrl.addChapter);
router.put("/:moduleId/chapters/reorder", ...canEdit, ctrl.reorderChapters);
router.put("/chapters/:chapterId", ...canEdit, ctrl.updateChapter);
router.delete("/chapters/:chapterId", ...canEdit, ctrl.deleteChapter);

router.post("/chapters/:chapterId/contents", ...canEdit, ctrl.addContent);
router.put("/chapters/:chapterId/contents/reorder", ...canEdit, ctrl.reorderContents);
router.put("/contents/:contentId", ...canEdit, ctrl.updateContent);
router.put("/contents/:contentId/text", ...canEdit, ctrl.updateTextContent);
router.delete("/contents/:contentId", ...canEdit, ctrl.deleteContent);

router.post("/contents/:contentId/upload", ...canEdit, upload.single("file"), uploadCtrl.uploadFile);
router.delete("/contents/:contentId/file", ...canEdit, uploadCtrl.removeFile);

// QCM — vérification d'une réponse individuelle + soumission finale du bloc
router.post("/qcm/:questionId/check", requireAuth, ctrl.checkQcmAnswer);
router.post("/qcm/:contentId/submit", requireAuth, ctrl.submitQcm);
router.post("/contents/:contentId/qcm", ...canEdit, ctrl.addQcmQuestion);
router.put("/qcm/questions/:questionId", ...canEdit, ctrl.updateQcmQuestion);
router.delete("/qcm/questions/:questionId", ...canEdit, ctrl.deleteQcmQuestion);

// ── Import CSV ────────────────────────────────────────────────
router.post("/:moduleId/import-csv", ...canEdit, uploadCsv.single("file"), importCsv);

module.exports = router;

