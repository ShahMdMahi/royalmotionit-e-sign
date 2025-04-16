import { prisma } from "@/prisma/prisma";
import { VerificationToken } from "@prisma/client";

// Define interfaces for return types
interface BaseResponse {
  success: boolean;
  message: string;
  error?: unknown;
}

interface VerificationTokenResponse extends BaseResponse {
  token?: VerificationToken;
}

/**
 * Retrieves a verification token by its identifier.
 * @param {string} identifier - The identifier of the verification token to retrieve.
 * @returns {Promise<VerificationTokenResponse>} A promise that resolves to an object containing the success status, message, and token data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find a verification token in the database by its identifier. If the token is found, it returns the token data; otherwise, it returns an error message.
 */
export async function getVerificationTokenByIdentifier(identifier: string): Promise<VerificationTokenResponse> {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: identifier,
      },
    });

    if (verificationToken) {
      return {
        success: true,
        message: "Verification token fetched successfully",
        token: verificationToken,
      };
    }

    return {
      success: false,
      message: "Verification token not found",
    };
  } catch (error) {
    console.error("Error fetching verification token:", error);
    return {
      success: false,
      message: "Failed to fetch verification token",
      error: error,
    };
  }
}

/**
 * Creates a new verification token in the database.
 * @param {Object} tokenData - The data for the verification token to create.
 * @param {string} tokenData.identifier - The identifier for the verification token.
 * @param {string} tokenData.token - The token string.
 * @param {Date} tokenData.expires - The expiration date of the token.
 * @returns {Promise<VerificationTokenResponse>} A promise that resolves to an object containing the success status, message, and created token data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to create a new verification token in the database. It returns the created token data.
 */
export async function createVerificationToken(tokenData: { identifier: string; token: string; expires: Date }): Promise<VerificationTokenResponse> {
  try {
    const createdToken = await prisma.verificationToken.create({
      data: {
        identifier: tokenData.identifier,
        token: tokenData.token,
        expires: tokenData.expires,
      },
    });

    return {
      success: true,
      message: "Verification token created successfully",
      token: createdToken,
    };
  } catch (error) {
    console.error("Error creating verification token:", error);
    return {
      success: false,
      message: "Failed to create verification token",
      error: error,
    };
  }
}

/**
 * Deletes a verification token from the database.
 * @param {string} identifier - The identifier of the verification token to delete.
 * @returns {Promise<BaseResponse>} A promise that resolves to an object containing the success status, message, and error information if applicable.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to delete a verification token from the database by its identifier. If the deletion is successful, it returns a success message; otherwise, it returns an error message.
 */
export async function deleteVerificationToken(identifier: string): Promise<BaseResponse> {
  try {
    const deleteResult = await prisma.verificationToken.deleteMany({
      where: {
        identifier: identifier,
      },
    });

    if (deleteResult.count > 0) {
      return {
        success: true,
        message: "Verification token deleted successfully",
      };
    }

    return {
      success: false,
      message: "Verification token not found",
    };
  } catch (error) {
    console.error("Error deleting verification token:", error);
    return {
      success: false,
      message: "Failed to delete verification token",
      error: error,
    };
  }
}
