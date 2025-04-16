"use server";

import { sendEmail } from "@/lib/email-helper";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/emails/welcome-email";
import AccountVerificationEmail from "@/emails/account-verification-email";

/**
 * Sends a welcome email to a new user
 * @param username - The user's display name
 * @param userEmail - The user's email address
 * @returns Promise that resolves when email is sent or rejects on error
 */
export async function sendWelcomeEmail(username: string, userEmail: string): Promise<void> {
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
export async function sendAccountVerificationEmail(username: string, userEmail: string, verificationToken: string): Promise<void> {
  try {
    const emailContent = await render(AccountVerificationEmail({ username, userEmail, verificationToken }));

    await sendEmail({
      recipient: userEmail,
      subject: "Verify your account",
      html: emailContent,
    });
  } catch (error) {
    console.error("Error sending account verification email:", error);
  }
}
