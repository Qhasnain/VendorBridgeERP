import PDFDocument from 'pdfkit';

/**
 * Generates a high-fidelity PDF invoice document as a binary buffer
 */
export function generateInvoicePdf(invoice: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // --- HEADER BRANDING ---
      doc
        .fillColor('#2563EB')
        .fontSize(20)
        .text('VENDORBRIDGE CORP', 50, 45)
        .fontSize(10)
        .fillColor('#475569')
        .text('Enterprise Procurement Systems', 50, 70)
        .text('100 Enterprise Boulevard, Bangalore, Karnataka', 50, 85)
        .text('GSTIN: 29VENDORBR1234Z', 50, 100);

      doc
        .fillColor('#0F172A')
        .fontSize(16)
        .text('TAX INVOICE', 200, 45, { align: 'right' })
        .fontSize(9)
        .fillColor('#475569')
        .text(`Invoice Number: ${invoice.invoiceNumber}`, 200, 70, { align: 'right' })
        .text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 200, 85, { align: 'right' })
        .text(`PO Ref: ${invoice.purchaseOrder.poNumber}`, 200, 100, { align: 'right' })
        .text(`Status: ${invoice.status.toUpperCase()}`, 200, 115, { align: 'right' });

      // Draw horizontal dividing line
      doc.moveTo(50, 140).lineTo(550, 140).strokeColor('#E2E8F0').stroke();

      // --- SUPPLIER & CLIENT DETAILS ---
      doc
        .fillColor('#0F172A')
        .fontSize(10)
        .text('Supplier Details:', 50, 160)
        .fontSize(9)
        .fillColor('#475569')
        .text(invoice.purchaseOrder.vendor.companyName, 50, 175)
        .text(invoice.purchaseOrder.vendor.contactPerson, 50, 190)
        .text(invoice.purchaseOrder.vendor.address, 50, 205, { width: 220 })
        .text(`GSTIN: ${invoice.purchaseOrder.vendor.gstNumber}`, 50, 235)
        .text(`Email: ${invoice.purchaseOrder.vendor.email}`, 50, 250);

      doc
        .fillColor('#0F172A')
        .fontSize(10)
        .text('Billed To:', 320, 160)
        .fontSize(9)
        .fillColor('#475569')
        .text('VendorBridge Headquarters', 320, 175)
        .text('Procurement Operations Department', 320, 190)
        .text('Phase 2, IT Hub, Bangalore, Karnataka, 560001', 320, 205, { width: 220 })
        .text(`Authorized Officer: ${invoice.purchaseOrder.createdBy?.name || 'officer'}`, 320, 235);

      // Draw table header
      let y = 285;
      doc.rect(50, y, 500, 20).fill('#F1F5F9');
      doc
        .fillColor('#0F172A')
        .fontSize(9)
        .text('Scope Description / Required Products', 60, y + 6)
        .text('Qty', 380, y + 6, { align: 'right', width: 40 })
        .text('Unit', 450, y + 6, { align: 'right', width: 40 })
        .text('Total', 500, y + 6, { align: 'right', width: 40 });

      y += 20;

      // Draw table items
      const items = JSON.parse(invoice.purchaseOrder.rfq.productDetails || '[]');
      doc.fillColor('#475569').fontSize(9);
      
      items.forEach((item: any) => {
        doc.moveTo(50, y).lineTo(550, y).strokeColor('#F1F5F9').stroke();
        doc
          .text(item.name, 60, y + 8, { width: 300 })
          .text(String(item.quantity), 380, y + 8, { align: 'right', width: 40 })
          .text(item.unit, 450, y + 8, { align: 'right', width: 40 })
          .text('Included', 500, y + 8, { align: 'right', width: 40 });
        y += 25;
      });

      // Draw total price details
      y += 10;
      doc.moveTo(50, y).lineTo(550, y).strokeColor('#CBD5E1').stroke();
      y += 10;

      const gst = JSON.parse(invoice.gstBreakdown || '{}');
      const baseValue = invoice.totalAmount - invoice.taxAmount;

      doc
        .fontSize(9)
        .fillColor('#475569')
        .text('Taxable Base Value:', 320, y)
        .text(`${baseValue.toLocaleString('en-IN')} INR`, 450, y, { align: 'right', width: 90 });

      y += 15;
      doc
        .text(`CGST (9%):`, 320, y)
        .text(`${(gst.cgst || 0).toLocaleString('en-IN')} INR`, 450, y, { align: 'right', width: 90 });

      y += 15;
      doc
        .text(`SGST (9%):`, 320, y)
        .text(`${(gst.sgst || 0).toLocaleString('en-IN')} INR`, 450, y, { align: 'right', width: 90 });

      y += 20;
      doc
        .fontSize(11)
        .fillColor('#2563EB')
        .text('Grand Total (Billed):', 320, y)
        .text(`${invoice.totalAmount.toLocaleString('en-IN')} INR`, 450, y, { align: 'right', width: 90 });

      // --- TERMS FOOTER ---
      doc
        .fontSize(8)
        .fillColor('#94A3B8')
        .text('Terms & Instructions:', 50, 720)
        .text('1. Invoice payment was processed via authorized electronic credit disbursement.', 50, 735)
        .text('2. Subject to auditing logs and verification parameters of VendorBridge ERP.', 50, 745)
        .text('3. This is an automatically generated document. No physical signature required.', 50, 755);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
