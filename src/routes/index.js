const express = require("express");

const authRoutes = require("./auth.routes");
const moduleRoutes = require("./modules.routes");
const enrollmentRoutes = require("./enrollments.routes");
const progressRoutes = require("./progress.routes");
const checkoutRoutes = require("./checkout.routes");
const { apiRouter: videoApiRoutes } = require("./video.routes");
const adminRoutes = require("./admin.routes");
const creditPacksRoutes = require("./creditPacks.routes");
const creditsRoutes = require("./credits.routes");
const vatRoutes = require("./vat.routes");
const referralRoutes = require("./referral.routes");
const certificateSettingsRoutes = require("./certificateSettings.routes");
const chargeRoutes = require("./charge.routes");
const paymentsRoutes = require("./payments.routes");
const bannersRoutes = require("./banners.routes");
const promotionsRoutes = require("./promotions.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/modules", moduleRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/progress", progressRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/videos", videoApiRoutes);
router.use("/admin", adminRoutes);
router.use("/credit-packs", creditPacksRoutes);
router.use("/credits", creditsRoutes);
router.use("/vat", vatRoutes);
const legalRoutes = require("./legal.routes");
const tagsRoutes = require("./tags.routes");
const pathsRoutes = require("./paths.routes");

router.use("/referral", referralRoutes);
router.use("/admin/certificate-settings", certificateSettingsRoutes);
router.use("/charge", chargeRoutes);
router.use("/payments", paymentsRoutes);
router.use("/banners", bannersRoutes);
router.use("/admin/promotions", promotionsRoutes);
router.use("/legal", legalRoutes);
router.use("/tags", tagsRoutes);
router.use("/paths", pathsRoutes);
const analyticsRoutes = require("./analytics.routes");
router.use("/analytics", analyticsRoutes);
const contactRoutes = require("./contact.routes");
router.use("/contact", contactRoutes);

module.exports = router;
