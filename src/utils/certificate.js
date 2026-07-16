const PDFDocument = require("pdfkit");
const fs = require("fs");

// Génère une attestation PDF en mémoire (pas de fichier temporaire sur disque)
// et la renvoie sous forme de Buffer, prête à être streamée par la route.
// `settings` provient de la table certificate_settings (texte personnalisable
// par l'admin) ; `stampFilePath`/`signatureFilePath` sont les chemins absolus
// vers les images uploadées (uniquement si au format PNG/JPEG — le SVG n'est
// pas intégrable directement par pdfkit, voir certificateSettings.controller.js).
function generateCertificatePdf({ userName, moduleTitle, durationMin, completedAt, certificateNumber, settings, stampFilePath, signatureFilePath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const s = settings || {};

    const titleText = s.title_text || "Attestation de formation";
    const introText = s.intro_text || "TutoRisk certifie que";
    const subtitleText = s.subtitle_text || "a suivi avec succès la formation";
    const footerText = s.footer_text || "Document généré automatiquement — TutoRisk LCMS";
    const signatoryName = s.signatory_name || "Le Directeur";
    const signatoryTitle = s.signatory_title || "TutoRisk";

    // Cadre rouge
    doc.rect(0, 0, W, H).fill("#FFFFFF");
    doc.rect(24, 24, W - 48, H - 48).lineWidth(3).stroke("#CC1515");
    doc.rect(34, 34, W - 68, H - 68).lineWidth(1).stroke("#F0C6C6");

    // En-tête
    doc.fillColor("#CC1515").fontSize(13).font("Helvetica-Bold").text("TUTORISK", 0, 70, { align: "center" });
    doc.fillColor("#999").fontSize(9).font("Helvetica").text("FORMATION SANTÉ & SÉCURITÉ AU TRAVAIL", 0, 90, { align: "center" });

    doc.moveDown(2);
    doc.fillColor("#1a1a1a").fontSize(28).font("Helvetica-Bold").text(titleText, 0, 140, { align: "center" });

    doc.fontSize(12).font("Helvetica").fillColor("#555").text(introText, 0, 190, { align: "center" });

    doc.fontSize(22).font("Helvetica-Bold").fillColor("#CC1515").text(userName, 0, 215, { align: "center" });

    doc.fontSize(12).font("Helvetica").fillColor("#555").text(subtitleText, 0, 255, { align: "center" });

    doc.fontSize(17).font("Helvetica-Bold").fillColor("#1a1a1a").text(moduleTitle, 60, 280, { align: "center", width: W - 120 });

    const dateStr = new Date(completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    doc.fontSize(11).font("Helvetica").fillColor("#777").text(`Durée de la formation : ${durationMin} minutes  ·  Terminée le ${dateStr}`, 0, 330, { align: "center" });

    // Tampon et signature, côte à côte en bas à droite, si configurés et au
    // format intégrable (PNG/JPEG). Une erreur de lecture image ne doit jamais
    // faire échouer la génération du PDF (on l'ignore silencieusement).
    const stampSize = 80;
    const sigWidth = 130;
    const blockY = H - 175;
    try {
      if (stampFilePath && fs.existsSync(stampFilePath)) {
        doc.image(stampFilePath, W - 230, blockY, { width: stampSize, height: stampSize });
      }
    } catch { /* image illisible, on continue sans */ }
    try {
      if (signatureFilePath && fs.existsSync(signatureFilePath)) {
        doc.image(signatureFilePath, W - 130, blockY + 15, { width: sigWidth, height: 50 });
      }
    } catch { /* image illisible, on continue sans */ }

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a1a").text(signatoryName, W - 230, blockY + stampSize + 8, { width: 200, align: "center" });
    doc.fontSize(9).font("Helvetica").fillColor("#888").text(signatoryTitle, W - 230, blockY + stampSize + 22, { width: 200, align: "center" });

    // Pied
    doc.fontSize(9).fillColor("#aaa").text(`Référence d'attestation : ${certificateNumber}`, 0, H - 70, { align: "center" });
    doc.fontSize(9).fillColor("#aaa").text(footerText, 0, H - 55, { align: "center" });

    doc.end();
  });
}

module.exports = { generateCertificatePdf };
