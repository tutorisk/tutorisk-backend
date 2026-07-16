const express = require("express");
const ctrl = require("../controllers/legal.controller");

const router = express.Router();

router.get("/privacy-policy", ctrl.privacyPolicy);
router.get("/legal-notice", ctrl.legalNotice);

module.exports = router;
