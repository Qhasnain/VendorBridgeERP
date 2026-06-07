import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma';

// Create a local mail log directory for development fallback
const MAIL_LOGS_DIR = '/tmp/mail_logs';

if (!fs.existsSync(MAIL_LOGS_DIR)) {
  fs.mkdirSync(MAIL_LOGS_DIR, { recursive: true });
}
// SMTP Transport Config from Environment
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

let transporter: nodemailer.Transporter | null = null;
let etherealInitStarted = false;

/**
 * Initializes and caches the SMTP transporter.
 * If no local SMTP credentials exist, it dynamically creates a live Ethereal test account.
 */
async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    console.log(`[SMTP SETUP] Transport configured targeting ${SMTP_HOST}:${SMTP_PORT}`);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else if (!etherealInitStarted) {
    etherealInitStarted = true;
    try {
      console.log(`[SMTP SETUP] No local SMTP credentials found. Initializing live Ethereal test SMTP account...`);
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[SMTP SETUP] Dynamic Ethereal testing account generated:`);
      console.log(` - SMTP Host: ${testAccount.smtp.host}`);
      console.log(` - User/Email: ${testAccount.user}`);
      
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err: any) {
      console.error(`[SMTP SETUP] Ethereal setup failed: ${err.message}. Falling back to file logger.`);
      transporter = null;
    } finally {
      etherealInitStarted = false;
    }
  }

  return transporter;
}

interface SendMailOptions {
  invoiceId: number;
  invoiceNumber: string;
  to: string;
  pdfBuffer: Buffer;
}

/**
 * Dispatches an email with retry checks and database logging
 */
export async function sendInvoiceEmail(options: SendMailOptions): Promise<boolean> {
  const { invoiceId, invoiceNumber, to, pdfBuffer } = options;
  const subject = `Invoice ${invoiceNumber} issued by VendorBridge`;
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #2563eb; color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">VendorBridge Invoice Dispatch</h2>
      </div>
      <div style="padding: 24px;">
        <p>Dear Finance Team,</p>
        <p>A new tax invoice <strong>${invoiceNumber}</strong> has been generated and approved in the VendorBridge ERP system.</p>
        <p>We have compiled and attached the official itemized billing PDF for your review and payout clearance.</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
          <h4 style="margin: 0 0 8px 0; color: #0f172a;">Invoice Metadata:</h4>
          <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Document Code:</strong> ${invoiceNumber}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Clearance Target:</strong> Finance Team / Procurement desk</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from your VendorBridge instance.</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-t: 1px solid #e2e8f0;">
        &copy; 2026 VendorBridge ERP. All rights reserved.
      </div>
    </div>
  `;

  let attempts = 0;
  const maxAttempts = 3;
  let status = 'FAILED';
  let errorMsg: string | null = null;
  let previewUrl: string | null = null;

  // Attempt to retrieve active SMTP transporter
  const activeTransporter = await getTransporter();

  while (attempts < maxAttempts) {
    attempts++;
    try {
      if (activeTransporter) {
        // Real SMTP Delivery (either custom SMTP or live Ethereal testing SMTP)
        const fromAddress = SMTP_USER || 'test-system@vendorbridge.com';
        const info = await activeTransporter.sendMail({
          from: `"VendorBridge System" <${fromAddress}>`,
          to,
          subject,
          html: bodyHtml,
          attachments: [
            {
              filename: `${invoiceNumber}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        // Parse test message preview URL if generated
        const etherealUrl = nodemailer.getTestMessageUrl(info);
        if (etherealUrl) {
          previewUrl = etherealUrl;
          console.log(`[SMTP DELIVERED] Preview message online at: ${etherealUrl}`);
        }
      } else {
        // Local File Mock Delivery (Fallback if no internet or setup fail)
        const timestamp = Date.now();
        const mailFileName = `${invoiceNumber}_attempt_${attempts}_${timestamp}.html`;
        const mailFilePath = path.join(MAIL_LOGS_DIR, mailFileName);
        const pdfFileName = `${invoiceNumber}_${timestamp}.pdf`;
        const pdfFilePath = path.join(MAIL_LOGS_DIR, pdfFileName);

        // Write HTML body logs
        fs.writeFileSync(
          mailFilePath,
          `Subject: ${subject}\nTo: ${to}\nPDF Attachment: ${pdfFileName}\n\n${bodyHtml}`
        );
        // Write PDF attachment logs
        fs.writeFileSync(pdfFilePath, pdfBuffer);

        console.log(`[MAIL DISPATCHED LOCALLY] Created log files:\n - HTML: ${mailFilePath}\n - PDF: ${pdfFilePath}`);
      }

      status = 'SENT';
      errorMsg = null;
      break; // Exit retry loop on success
    } catch (err: any) {
      console.error(`Email attempt ${attempts} failed:`, err.message);
      errorMsg = err.message || 'Unknown SMTP error';
      // Bounded delay before retrying
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  // Write audit trail log in database
  try {
    const logDetails = previewUrl
      ? `SMTP delivered. Live Preview Link: ${previewUrl}`
      : `Email dispatched to ${to} with invoice PDF.`;

    await prisma.emailLog.create({
      data: {
        invoiceId,
        to,
        subject,
        body: logDetails,
        status,
        error: errorMsg,
        attempts,
      },
    });
  } catch (dbErr) {
    console.error('Failed to log email audit trail in DB:', dbErr);
  }

  return status === 'SENT';
}
