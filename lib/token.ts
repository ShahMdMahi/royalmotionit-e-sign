import { createVerificationToken, deleteVerificationToken, getVerificationTokenByIdentifier } from "@/data/verification-token";
import { v4 as uuid } from "uuid";

// Define interfaces for return types
interface BaseResponse {
  success: boolean;
  message: string;
  error?: unknown;
}

interface VerificationTokenResult extends BaseResponse {
  verificationToken?: {
    identifier: string;
    token: string;
    expires: Date;
  };
}

/**
 * Generates a verification token for a given email.
 * @param {string} email - The email to generate a verification token for.
 * @returns {Promise<VerificationTokenResult>} A promise that resolves to an object containing the success status, message, and verification token data or error information.
 * @throws {Error} Throws an error if there is an issue with the token generation process.
 * @description This function generates a UUID token that expires in 1 hour, checks for and deletes any existing tokens for the email, and creates a new token in the database.
 */
export async function generateVerificationToken(email: string): Promise<VerificationTokenResult> {
  try {
    const token = uuid();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const emailLower = email.toLowerCase(); // Ensure the email is in lowercase

    // Check if a token already exists for the email
    const existingToken = await getVerificationTokenByIdentifier(emailLower);

    // Delete the existing token if it exists
    if (existingToken.success && existingToken.token) {
      await deleteVerificationToken(emailLower);
    }

    // Create a new token
    const verificationToken = await createVerificationToken({
      identifier: emailLower,
      token: token,
      expires: expires,
    });

    if (verificationToken.success) {
      return {
        success: true,
        message: "Verification token generated successfully",
        verificationToken: {
          identifier: emailLower,
          token: token,
          expires: expires,
        },
      };
    } else {
      return {
        success: false,
        message: "Failed to generate verification token",
        error: verificationToken.error,
      };
    }
  } catch (error) {
    console.error("Error generating verification token:", error);
    return {
      success: false,
      message: "Failed to generate verification token",
      error: error,
    };
  }
}
