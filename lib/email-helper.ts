import nodemailer from "nodemailer";

interface Payload {
  recipient: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | Uint8Array;
    contentType?: string;
  }>;
}

const smtpSettings = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_PASSWORD,
  },
};

/**
 * Sends an email using nodemailer and Gmail SMTP.
 * @param {Payload} payload - The email details.
 * @param {string} payload.recipient - The recipient's email address.
 * @param {string} payload.subject - The subject of the email.
 * @param {string} payload.html - The HTML content of the email.
 * @param {Array<{filename: string, content: Buffer | Uint8Array, contentType?: string}>} [payload.attachments] - Optional file attachments.
 */
export const sendEmail = async (payload: Payload) => {
  const { recipient, subject, html, attachments } = payload;

  // Log email sending attempt
  console.log(`Attempting to send email to: ${recipient}`);
  console.log(`Subject: ${subject}`);

  // Check if SMTP credentials are configured
  if (!process.env.GMAIL_SMTP_USER || !process.env.GMAIL_SMTP_PASSWORD) {
    console.error(
      "SMTP credentials are missing. Please set GMAIL_SMTP_USER and GMAIL_SMTP_PASSWORD environment variables.",
    );

    // For development, log the email content that would have been sent
    console.log("Email would have been sent with the following details:");
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log("Content preview:", html.substring(0, 100) + "...");
    
    if (attachments && attachments.length > 0) {
      console.log(`Email has ${attachments.length} attachment(s):`);
      attachments.forEach((attachment, index) => {
        console.log(`  Attachment ${index + 1}: ${attachment.filename} (${attachment.content.byteLength} bytes)`);
      });
    }

    return; // Don't attempt to send without credentials
  }

  const transporter = nodemailer.createTransport(smtpSettings);

  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Royal Sign" <${process.env.GMAIL_SMTP_USER}>`,
      to: recipient,
      subject,
      html,
    };
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        ...att,
        content: att.content instanceof Uint8Array && !(att.content instanceof Buffer)
          ? Buffer.from(att.content)
          : att.content,
      }));
    }
    
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully to ${recipient}`);
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending email:", error);
    console.error("SMTP configuration:", {
      host: smtpSettings.host,
      port: smtpSettings.port,
      user: process.env.GMAIL_SMTP_USER?.substring(0, 3) + "...", // Log partial username for debugging
    });
  }
};
