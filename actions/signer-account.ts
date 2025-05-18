"use server";

import { prisma } from "@/prisma/prisma";
import bcryptjs from "bcryptjs";
import {
  sendWelcomeEmail,
  sendDocumentSignRequestEmail,
  sendAccountVerificationEmail,
  sendNewSignerCredentialsEmail,
} from "@/actions/email";
import { generateVerificationToken } from "@/lib/token";
import { format } from "date-fns";

/**
 * Generate a random password with specified length
 * @param length The length of the password to generate
 * @returns Random password string
 */
function generateRandomPassword(length = 12): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+=-";

  const allChars = lowercase + uppercase + numbers + symbols;

  // Ensure at least one character from each group
  let password =
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  password = password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");

  return password;
}

/**
 * Creates or retrieves a user account for a signer
 * If the user doesn't exist, creates a new account with a random password
 * @param email Signer's email address
 * @param name Optional name for the signer if not already in the system
 * @returns Information about the user and whether a new account was created
 */
export async function ensureSignerAccount(
  email: string,
  name?: string,
): Promise<{
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    isNewUser: boolean;
  } | null;
  password?: string;
  error?: string;
}> {
  try {
    // Normalize email to lowercase
    const emailLower = email.toLowerCase();

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    if (existingUser) {
      return {
        success: true,
        message: "Existing user found",
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email || emailLower,
          isNewUser: false,
        },
      };
    }

    // User doesn't exist, create a new account using a random password
    const password = generateRandomPassword();
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create first and last name from email if name not provided
    let userFullName = name || emailLower.split("@")[0];
    // Capitalize and format name
    userFullName = userFullName
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name: userFullName,
        email: emailLower,
        password: hashedPassword,
      },
    });

    if (!newUser) {
      return {
        success: false,
        message: "Failed to create user account",
        user: null,
        error: "Database operation failed",
      };
    }

    // Send welcome email with password
    await sendWelcomeEmail(userFullName, emailLower);

    // Generate verification token
    const verificationToken = await generateVerificationToken(emailLower);

    // Send verification email
    if (
      verificationToken.success &&
      verificationToken.verificationToken?.token
    ) {
      await sendAccountVerificationEmail(
        userFullName,
        emailLower,
        verificationToken.verificationToken.token,
      );
    }
    // Log password for debugging (remove in production)
    console.log(
      `Created new user account for ${emailLower} with password: ${password}`,
    );

    await sendNewSignerCredentialsEmail(userFullName, emailLower, password);

    // Return new user info with temporary password
    return {
      success: true,
      message: "New user account created",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email || emailLower,
        isNewUser: true,
      },
      password: password,
    };
  } catch (error) {
    console.error("Error ensuring signer account:", error);
    return {
      success: false,
      message: "Failed to process signer account",
      user: null,
      error: String(error),
    };
  }
}

/**
 * Send document signing request with appropriate email based on whether user is new or existing
 */
export async function sendSigningRequestWithAccountInfo(
  signerEmail: string,
  signerName: string | null,
  documentId: string,
  documentTitle: string,
  senderName: string,
  senderEmail: string,
  temporaryPassword?: string,
  message?: string,
  expirationDate?: Date,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (temporaryPassword) {
      // This is a new user, send them the new signer email with credentials
      try {
        // Send email with credentials
        await sendNewSignerCredentialsEmail(
          signerName || "Signer",
          signerEmail,
          temporaryPassword,
        );

        console.log(
          `Email with temporary password sent successfully to ${signerEmail}`,
        );
      } catch (emailError) {
        console.error(
          "Error sending email with temporary password:",
          emailError,
        );
      }
    } else {
      // Existing user, send normal document signing request
      await sendDocumentSignRequestEmail(
        signerName || "Signer",
        signerEmail,
        documentTitle,
        documentId,
        message || "",
        senderName,
        senderEmail,
        expirationDate,
      );
    }

    return {
      success: true,
      message: "Signing request sent successfully",
    };
  } catch (error) {
    console.error("Error sending signing request with account info:", error);
    return {
      success: false,
      message: "Failed to send signing request",
    };
  }
}
