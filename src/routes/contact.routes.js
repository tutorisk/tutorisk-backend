const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/contact.controller");

const router = express.Router();

// Public — formulaire de contact
router.post("/", ctrl.submitContact);
// Admin — gestion des messages reçus
router.get("/", requireAuth, requireRole("admin"), ctrl.listMessages);
router.put("/:id/read", requireAuth, requireRole("admin"), ctrl.markRead);

module.exports = router;
