"use server";

import { sendEmail } from "@/lib/email-helper";
import { render } from "@react-email/render";
import { format } from "date-fns";
import { WelcomeEmail } from "@/emails/welcome-email";
import { AccountVerificationEmail } from "@/emails/account-verification-email";
import { ResetPasswordEmail } from "@/emails/reset-password-email";
import { DocumentSignEmail } from "@/emails/document-sign-email";
import { DocumentSignedNotification } from "@/emails/document-signed-notification";
import { NewSignerEmail } from "@/emails/new-signer-email";
import { DocumentSignedWithPdf } from "@/emails/document-signed-with-pdf";
import { DocumentSignedWithPdfToAdmin } from "@/emails/document-signed-with-pdf-to-admin";

/**
 * Sends a welcome email to a new user
 * @param username - The user's display name
 * @param userEmail - The user's email address
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendWelcomeEmail(
  username: string,
  userEmail: string,
): Promise<void> {
  try {
    const emailContent = await render(WelcomeEmail({ username, userEmail }));

    await sendEmail({
      recipient: userEmail,
      subject: "Welcome to Royal Sign!",
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

/**
 * Sends an account verification email to a new user
 * @param username - The user's display name
 * @param userEmail - The user's email address
 * @param verificationToken - The token for verifying the user's account
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendAccountVerificationEmail(
  username: string,
  userEmail: string,
  verificationToken: string,
): Promise<void> {
  try {
    const emailContent = await render(
      AccountVerificationEmail({ username, userEmail, verificationToken }),
    );

    await sendEmail({
      recipient: userEmail,
      subject: "Verify your account",
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending account verification email:", error);
  }
}

/**
 * Sends a password reset email to a user
 * @param username - The user's display name
 * @param userEmail - The user's email address
 * @param resetToken - The token for resetting the user's password
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendResetPasswordEmail(
  username: string,
  userEmail: string,
  resetToken: string,
): Promise<void> {
  try {
    const emailContent = await render(
      ResetPasswordEmail({ username, userEmail, resetToken }),
    );

    await sendEmail({
      recipient: userEmail,
      subject: "Reset your password",
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
}

/**
 * Sends a document signing request email to a signer
 * @param recipientName - The signer's name
 * @param recipientEmail - The signer's email address
 * @param documentTitle - The title of the document
 * @param documentId - The ID of the document
 * @param senderName - The name of the sender
 * @param senderEmail - The email of the sender
 * @param message - Optional message from the sender
 * @param expirationDate - Optional expiration date for the document
 * @returns Promise that resolves when email is sent or rejects on error
 */
/**
 * Sends a document signing request email to a signer when document is saved after editing
 * @param recipientName - The signer's name
 * @param recipientEmail - The signer's email address
 * @param documentTitle - The title of the document
 * @param documentId - The ID of the document
 * @param senderName - The name of the sender (admin)
 * @param senderEmail - The email of the sender (admin)
 * @param message - Optional message about the document update
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendDocumentUpdateEmail(
  recipientName: string,
  recipientEmail: string,
  documentTitle: string,
  documentId: string,
  senderName: string,
  senderEmail: string,
  message?: string,
): Promise<void> {
  try {
    // Use the same email template but with a custom update message
    const updateMessage =
      message || "The document has been updated. Please review and sign.";

    const emailContent = await render(
      DocumentSignEmail({
        recipientName,
        recipientEmail,
        documentTitle,
        documentId,
        message: updateMessage,
        senderName,
        senderEmail,
      }),
    );

    await sendEmail({
      recipient: recipientEmail,
      subject: `Document updated: "${documentTitle}"`,
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending document update email:", error);
  }
}

export async function sendDocumentSignRequestEmail(
  recipientName: string,
  recipientEmail: string,
  documentTitle: string,
  documentId: string,
  message: string,
  senderName?: string,
  senderEmail?: string,
  expirationDate?: Date,
): Promise<void> {
  try {
    const formattedExpirationDate = expirationDate
      ? format(expirationDate, "MMM dd, yyyy")
      : undefined;

    const emailContent = await render(
      DocumentSignEmail({
        recipientName,
        recipientEmail,
        documentTitle,
        documentId,
        message,
        senderName,
        senderEmail,
        expirationDate: formattedExpirationDate,
      }),
    );

    await sendEmail({
      recipient: recipientEmail,
      subject: `Document signing request: "${documentTitle}"`,
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending document sign request email:", error);
  }
}

/**
 * Sends a notification email when a document is signed
 * @param authorName - The document author's name
 * @param authorEmail - The document author's email
 * @param documentTitle - The title of the document
 * @param documentId - The ID of the document
 * @param signerName - The name of the signer
 * @param signerEmail - The email of the signer
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendDocumentSignedNotification(
  authorName: string,
  authorEmail: string,
  documentTitle: string,
  documentId: string,
  signerName: string,
  signerEmail: string,
): Promise<void> {
  try {
    const emailContent = await render(
      DocumentSignedNotification({
        authorName,
        documentTitle,
        documentId,
        signerName,
        signerEmail,
        isAllSignersCompleted: true, // Always true with single signer
      }),
    );

    const subject = `Document signed: "${documentTitle}"`;

    await sendEmail({
      recipient: authorEmail,
      subject,
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending document signed notification:", error);
  }
}

/**
 * Sends an email with login credentials to a newly created signer
 * @param recipientName - The signer's name
 * @param recipientEmail - The signer's email address
 * @param senderName - The name of the sender
 * @param senderEmail - The email of the sender
 * @param temporaryPassword - The temporary password for the new account
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendNewSignerCredentialsEmail(
  recipientName: string,
  recipientEmail: string,
  temporaryPassword: string,
): Promise<void> {
  try {
    const emailContent = await render(
      NewSignerEmail({
        username: recipientName,
        userEmail: recipientEmail,
        temporaryPassword,
      }),
    );

    await sendEmail({
      recipient: recipientEmail,
      subject: "Your Royal Sign Account Information",
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending new signer credentials email:", error);
  }
}

/**
 * Sends a signed document with PDF attachment to the user who signed it
 * @param recipientName - The recipient's name
 * @param recipientEmail - The recipient's email address
 * @param documentTitle - The title of the document
 * @param documentId - The ID of the document
 * @param pdfContent - The PDF content as Buffer or Uint8Array
 * @param senderName - Optional name of the sender
 * @param senderEmail - Optional email of the sender
 * @param message - Optional message
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendSignedDocumentWithPdf(
  recipientName: string,
  recipientEmail: string,
  documentTitle: string,
  documentId: string,
  pdfContent: Buffer | Uint8Array,
  senderName?: string,
  senderEmail?: string,
  message?: string,
): Promise<void> {
  try {
    const emailContent = await render(
      DocumentSignedWithPdf({
        recipientName,
        documentTitle,
        documentId,
        senderName: senderName || "Royal Sign",
        senderEmail: senderEmail || process.env.GMAIL_SMTP_USER || "no-reply@royalsign.com",
        message: message || "Your document has been successfully signed. Please find the attached PDF.",
      }),
    );

    const pdfFilename = `${documentTitle.replace(/[^a-zA-Z0-9]/g, "_")}-signed.pdf`;

    await sendEmail({
      recipient: recipientEmail,
      subject: `Signed Document: "${documentTitle}"`,
      html: emailContent,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfContent,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`Signed document email with PDF sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending signed document with PDF:", error);
  }
}

/**
 * Sends a signed document with PDF attachment to the admin
 * @param adminName - The admin's name
 * @param adminEmail - The admin's email address
 * @param documentTitle - The title of the document
 * @param documentId - The ID of the document
 * @param signerName - The name of the person who signed the document
 * @param signerEmail - The email of the person who signed the document
 * @param pdfContent - The PDF content as Buffer or Uint8Array
 * @param message - Optional message
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendSignedDocumentWithPdfToAdmin(
  adminName: string,
  adminEmail: string,
  documentTitle: string,
  documentId: string,
  signerName: string,
  signerEmail: string,
  pdfContent: Buffer | Uint8Array,
  message?: string,
): Promise<void> {
  try {
    const emailContent = await render(
      DocumentSignedWithPdfToAdmin({
        adminName,
        documentTitle,
        documentId,
        signerName,
        signerEmail,
        message,
      }),
    );

    const pdfFilename = `${documentTitle.replace(/[^a-zA-Z0-9]/g, "_")}-signed.pdf`;

    await sendEmail({
      recipient: adminEmail,
      subject: `Admin Notification: Document "${documentTitle}" Signed`,
      html: emailContent,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfContent,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`Admin notification email with signed PDF sent to ${adminEmail}`);
  } catch (error) {
    console.error("Error sending admin notification with signed PDF:", error);
  }
}
