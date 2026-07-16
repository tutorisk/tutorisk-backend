const PDFDocument = require("pdfkit");

// Génère la facture que l'ambassadeur "émet" à TutoRisk pour la commission
// accumulée, nécessaire pour appuyer sa demande de remboursement.
function generateAmbassadorInvoicePdf({ invoiceNumber, issuerName, issuerEmail, accountHolder, iban, amountCents, date }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#1a1a1a").fontSize(18).font("Helvetica-Bold").text("Facture", 50, 50);
    doc.fontSize(10).font("Helvetica").fillColor("#666").text(`N° ${invoiceNumber}`, 50, 75);
    doc.text(`Date : ${new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`, 50, 89);

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1a1a1a").text("Émetteur (ambassadeur)", 50, 130);
    doc.font("Helvetica").fontSize(10).fillColor("#444");
    doc.text(issuerName, 50, 148);
    doc.text(issuerEmail, 50, 162);
    doc.text(`Titulaire du compte : ${accountHolder}`, 50, 176);
    doc.text(`IBAN : ${iban}`, 50, 190);

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1a1a1a").text("Destinataire", 320, 130);
    doc.font("Helvetica").fontSize(10).fillColor("#444");
    doc.text("TutoRisk SAS", 320, 148);
    doc.text("Programme ambassadeur", 320, 162);

    const tableTop = 240;
    doc.rect(50, tableTop, 495, 26).fill("#F5F5F5");
    doc.fillColor("#1a1a1a").fontSize(10).font("Helvetica-Bold");
    doc.text("Description", 60, tableTop + 8);
    doc.text("Montant", 470, tableTop + 8, { width: 75, align: "right" });

    const rowY = tableTop + 36;
    doc.font("Helvetica").fontSize(10).fillColor("#1a1a1a");
    doc.text("Commission ambassadeur TutoRisk — filleuls parrainés", 60, rowY, { width: 380 });
    doc.text(`${(amountCents / 100).toFixed(2)} €`, 470, rowY, { width: 75, align: "right" });

    doc.moveTo(50, rowY + 25).lineTo(545, rowY + 25).strokeColor("#EBEBEB").stroke();

    doc.font("Helvetica-Bold").fontSize(13).fillColor("#1a1a1a");
    doc.text("Total à payer", 350, rowY + 40);
    doc.text(`${(amountCents / 100).toFixed(2)} €`, 470, rowY + 40, { width: 75, align: "right" });

    doc.fontSize(8).fillColor("#aaa").text(
      "Document généré automatiquement à partir des données du compte ambassadeur — TutoRisk LCMS",
      50, 760, { width: 495, align: "center" }
    );

    doc.end();
  });
}

module.exports = { generateAmbassadorInvoicePdf };
