import nodemailer from "nodemailer";

interface Payload {
  recipient: string;
  subject: string;
  html: string;
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
 */
export const sendEmail = async (payload: Payload) => {
  const { recipient, subject, html } = payload;

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

    return; // Don't attempt to send without credentials
  }

  const transporter = nodemailer.createTransport(smtpSettings);

  try {
    const info = await transporter.sendMail({
      from: `"Royal Sign" <${process.env.GMAIL_SMTP_USER}>`,
      to: recipient,
      subject,
      html,
    });

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
