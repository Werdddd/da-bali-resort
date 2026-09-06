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
        .text("Official Invoice / Receipt", 50, 78);

      doc
        .fillColor(coffee900)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`Invoice No: #${data.id.toString().padStart(6, "0")}`, 0, 50, { align: "right" });
      doc
        .fillColor(coffee600)
        .font("Helvetica")
        .text(`Date: ${data.createdAt}`, 0, 65, { align: "right" });
      doc
        .fillColor(data.status.toLowerCase().includes("confirm") || data.status.toLowerCase().includes("complet") ? "#2E7D32" : coffee900)
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

      doc.fillColor(coffee600).fontSize(10).font("Helvetica").text("Reservation Code", 50, y);
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

      y += 10;
      doc.moveTo(50, y).lineTo(545, y).strokeColor("#E0D5C8").stroke();
      y += 20;

      // Pricing box
      const boxTop = y;
      doc.fillColor(coffee600).fontSize(10).font("Helvetica").text("Total Quotation", 50, y);
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

      y += 40;
      doc
        .fillColor(coffee400)
        .fontSize(9)
        .font("Helvetica")
        .text("This is a computer-generated invoice. No signature required.", 50, y, { width: 495, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
