"use server";

import { sendEmail } from "@/lib/email-helper";
import { render } from "@react-email/render";
import { format } from "date-fns";
import { WelcomeEmail } from "@/emails/welcome-email";
import { AccountVerificationEmail } from "@/emails/account-verification-email";
import { ResetPasswordEmail } from "@/emails/reset-password-email";
import { DocumentSignEmail } from "@/emails/document-sign-email";
import { DocumentSignedNotification } from "@/emails/document-signed-notification";

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
export async function sendDocumentSignRequestEmail(
  recipientName: string,
  recipientEmail: string,
  documentTitle: string,
  documentId: string,
  senderName: string,
  senderEmail: string,
  message?: string,
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
        senderName,
        senderEmail,
        message,
        expirationDate: formattedExpirationDate,
      }),
    );

    await sendEmail({
      recipient: recipientEmail,
      subject: `${senderName} has requested your signature: "${documentTitle}"`,
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
