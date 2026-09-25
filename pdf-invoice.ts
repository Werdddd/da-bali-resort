import PDFDocument from "pdfkit";

export interface InvoiceData {
  id: number;
  createdAt: string;
  status: string;
  paymentMethod: string;
  reservationCode: string;
  itemLabel: string; // "Room" or "Amenity"
  itemName: string;
  guestName: string;
  guestEmail?: string;
  details: { label: string; value: string }[]; // dates, duration, guests, pax, etc.
  totalPrice: number;
  amountPaid: number;
  amountDue: number;
  // Optional POS receipt extras
  documentTitle?: string; // defaults to "Official Invoice / Receipt"
  documentNumber?: string; // defaults to "#000123" built from id
  codeLabel?: string; // defaults to "Reservation Code"
  totalLabel?: string; // defaults to "Total Quotation"
  lineItems?: { description: string; quantity: number; unitPrice: number; total: number }[];
  paymentRows?: { label: string; value: number }[]; // e.g. cash tendered / change, shown under the totals
  footerNote?: string;
}

const PESO = (n: number) => `PHP ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const coffee900 = "#3E2723";
      const coffee600 = "#6D4C41";
      const coffee400 = "#A1887F";
      const accent = "#A3402A";

      // Header
      doc
        .fillColor(coffee900)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("Da Bali Resort", 50, 50);
      doc
        .fillColor(coffee600)
        .fontSize(10)
        .font("Helvetica")
        .text(data.documentTitle || "Official Invoice / Receipt", 50, 78);

      doc
        .fillColor(coffee900)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`${data.documentNumber ? "Receipt No" : "Invoice No"}: ${data.documentNumber || `#${data.id.toString().padStart(6, "0")}`}`, 0, 50, { align: "right" });
      doc
        .fillColor(coffee600)
        .font("Helvetica")
        .text(`Date: ${data.createdAt}`, 0, 65, { align: "right" });
      doc
        .fillColor(data.status.toLowerCase().includes("confirm") || data.status.toLowerCase().includes("complet") ? "#2E7D32" : data.status.toLowerCase().includes("void") ? "#C62828" : coffee900)
        .font("Helvetica-Bold")
        .text(data.status.toUpperCase(), 0, 80, { align: "right" });

      doc.moveTo(50, 110).lineTo(545, 110).strokeColor("#E0D5C8").stroke();

      // Guest / booking info
      let y = 125;
      doc.fillColor(coffee600).fontSize(10).font("Helvetica").text("Billed To", 50, y);
      doc.fillColor(coffee900).font("Helvetica-Bold").fontSize(12).text(data.guestName || "Guest", 50, y + 15);
      if (data.guestEmail) {
        doc.fillColor(coffee600).font("Helvetica").fontSize(10).text(data.guestEmail, 50, y + 32);
      }

      doc.fillColor(coffee600).fontSize(10).font("Helvetica").text("Payment Method", 300, y, { width: 245, align: "right" });
      doc.fillColor(coffee900).font("Helvetica-Bold").fontSize(12).text(data.paymentMethod || "N/A", 300, y + 15, { width: 245, align: "right" });

      y += 60;
      doc.moveTo(50, y).lineTo(545, y).strokeColor("#E0D5C8").stroke();
      y += 15;

      doc.fillColor(coffee600).fontSize(10).font("Helvetica").text(data.codeLabel || "Reservation Code", 50, y);
      doc.fillColor(coffee900).font("Helvetica-Bold").fontSize(12).text(data.reservationCode, 300, y, { width: 245, align: "right" });

      y += 25;
      doc.fillColor(coffee600).fontSize(10).font("Helvetica").text(data.itemLabel, 50, y);
      doc.fillColor(coffee900).font("Helvetica-Bold").fontSize(12).text(data.itemName, 300, y, { width: 245, align: "right" });

      y += 25;
      for (const detail of data.details) {
        doc.fillColor(coffee600).fontSize(10).font("Helvetica").text(detail.label, 50, y);
        doc.fillColor(coffee900).font("Helvetica-Bold").fontSize(11).text(detail.value, 300, y, { width: 245, align: "right" });
        y += 22;
      }

      // Itemized lines (POS receipts)
      if (data.lineItems && data.lineItems.length > 0) {
        y += 10;
        const drawItemHeader = () => {
          doc.rect(50, y - 4, 495, 20).fillOpacity(0.06).fillColor(coffee900).fill();
          doc.fillOpacity(1);
          doc.fillColor(coffee600).fontSize(9).font("Helvetica-Bold");
          doc.text("ITEM", 58, y + 1, { width: 250 });
          doc.text("QTY", 310, y + 1, { width: 40, align: "right" });
          doc.text("UNIT PRICE", 355, y + 1, { width: 90, align: "right" });
          doc.text("AMOUNT", 450, y + 1, { width: 87, align: "right" });
          y += 24;
        };
        drawItemHeader();
        for (const line of data.lineItems) {
          const descHeight = doc.font("Helvetica").fontSize(10).heightOfString(line.description, { width: 250 });
          if (y + descHeight > 760) {
            doc.addPage();
            y = 50;
            drawItemHeader();
          }
          doc.fillColor(coffee900).fontSize(10).font("Helvetica").text(line.description, 58, y, { width: 250 });
          doc.text(String(line.quantity), 310, y, { width: 40, align: "right" });
          doc.text(PESO(line.unitPrice), 355, y, { width: 90, align: "right" });
          doc.font("Helvetica-Bold").text(PESO(line.total), 450, y, { width: 87, align: "right" });
          y += Math.max(descHeight, 14) + 8;
        }
      }

      if (y > 640) {
        doc.addPage();
        y = 50;
      }

      y += 10;
      doc.moveTo(50, y).lineTo(545, y).strokeColor("#E0D5C8").stroke();
      y += 20;

      // Pricing box
      const boxTop = y;
      doc.fillColor(coffee600).fontSize(10).font("Helvetica").text(data.totalLabel || "Total Quotation", 50, y);
      doc.fillColor(accent).font("Helvetica-Bold").fontSize(12).text(PESO(data.totalPrice), 300, y, { width: 245, align: "right" });

      y += 22;
      doc.fillColor(coffee600).fontSize(10).font("Helvetica").text("Total Amount Paid", 50, y);
      doc.fillColor(coffee600).font("Helvetica-Bold").fontSize(14).text(PESO(data.amountPaid), 300, y, { width: 245, align: "right" });

      if (data.amountDue > 0) {
        y += 26;
        doc.rect(50, y - 4, 495, 26).fillOpacity(0.08).fillColor("#C62828").fill();
        doc.fillOpacity(1);
        doc.fillColor("#C62828").fontSize(11).font("Helvetica-Bold").text("Amount Due", 58, y + 2);
        doc.fillColor("#C62828").fontSize(14).font("Helvetica-Bold").text(PESO(data.amountDue), 300, y + 2, { width: 237, align: "right" });
        y += 22;
      }

      for (const row of data.paymentRows || []) {
        y += 22;
        doc.fillColor(coffee600).fontSize(10).font("Helvetica").text(row.label, 50, y);
        doc.fillColor(coffee900).font("Helvetica-Bold").fontSize(11).text(PESO(row.value), 300, y, { width: 245, align: "right" });
      }

      y += 40;
      doc
        .fillColor(coffee400)
        .fontSize(9)
        .font("Helvetica")
        .text(data.footerNote || "This is a computer-generated invoice. No signature required.", 50, y, { width: 495, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
