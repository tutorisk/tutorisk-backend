const PDFDocument = require("pdfkit");

function generateReceiptPdf({ receiptNumber, buyerName, buyerEmail, label, amountCentsHt, vatRatePercent, amountCentsTtc, paymentMethod, date }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#CC1515").fontSize(20).font("Helvetica-Bold").text("TutoRisk", 50, 50);
    doc.fillColor("#888").fontSize(9).font("Helvetica").text("Formation santé & sécurité au travail", 50, 74);

    doc.fillColor("#1a1a1a").fontSize(16).font("Helvetica-Bold").text("Reçu de paiement", 50, 120);
    doc.fontSize(10).font("Helvetica").fillColor("#666").text(`Référence : ${receiptNumber}`, 50, 145);
    doc.text(`Date : ${new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`, 50, 160);

    doc.fontSize(10).fillColor("#1a1a1a").text(`Client : ${buyerName}`, 50, 190);
    doc.fillColor("#666").text(buyerEmail, 50, 204);

    // Tableau récapitulatif
    const tableTop = 250;
    doc.rect(50, tableTop, 495, 26).fill("#FDEAEA");
    doc.fillColor("#CC1515").fontSize(10).font("Helvetica-Bold");
    doc.text("Désignation", 60, tableTop + 8);
    doc.text("Montant HT", 320, tableTop + 8);
    doc.text("TVA", 420, tableTop + 8);
    doc.text("Montant TTC", 470, tableTop + 8, { width: 75, align: "right" });

    const rowY = tableTop + 36;
    doc.fillColor("#1a1a1a").font("Helvetica").fontSize(10);
    doc.text(label, 60, rowY, { width: 250 });
    doc.text(`${(amountCentsHt / 100).toFixed(2)} €`, 320, rowY);
    doc.text(`${vatRatePercent}%`, 420, rowY);
    doc.text(`${(amountCentsTtc / 100).toFixed(2)} €`, 470, rowY, { width: 75, align: "right" });

    doc.moveTo(50, rowY + 25).lineTo(545, rowY + 25).strokeColor("#EBEBEB").stroke();

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1a1a1a");
    doc.text("Total payé TTC", 320, rowY + 40);
    doc.fillColor("#CC1515").text(`${(amountCentsTtc / 100).toFixed(2)} €`, 470, rowY + 40, { width: 75, align: "right" });

    const methodLabel = paymentMethod === "card" ? "Carte bancaire (Stripe)" : "Virement bancaire";
    doc.font("Helvetica").fontSize(10).fillColor("#666").text(`Moyen de paiement : ${methodLabel}`, 50, rowY + 75);

    doc.fontSize(8).fillColor("#aaa").text("Document généré automatiquement — TutoRisk LCMS", 50, 760, { width: 495, align: "center" });

    doc.end();
  });
}

module.exports = { generateReceiptPdf };
