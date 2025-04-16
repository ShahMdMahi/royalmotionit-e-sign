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
  const transporter = nodemailer.createTransport(smtpSettings);

  try {
    await transporter.sendMail({
      from: "Royal Sign",
      to: recipient,
      subject,
      html,
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
