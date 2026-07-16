const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/video.controller");

// Routes API classiques (sous /api/videos) — nécessitent un Bearer token
const apiRouter = express.Router();
apiRouter.post("/:contentId/url", requireAuth, ctrl.getSignedUrl);

// Route de streaming — montée séparément à la racine (/stream/:contentId), car la balise
// <video> du navigateur ne peut pas envoyer de header Authorization. La sécurité repose
// sur le jeton signé transmis en query string (voir video.controller.js).
const streamRouter = express.Router();
streamRouter.get("/:contentId", ctrl.streamVideo);

module.exports = { apiRouter, streamRouter };
