import { prisma } from "@/prisma/prisma";
import { ResetPasswordToken } from "@prisma/client";

// Define interfaces for return types
interface BaseResponse {
  success: boolean;
  message: string;
  error?: unknown;
}

interface ResetPasswordTokenResponse extends BaseResponse {
  token?: ResetPasswordToken;
}

/**
 * Retrieves a reset password token by its identifier.
 * @param {string} identifier - The identifier of the reset password token to retrieve.
 * @returns {Promise<ResetPasswordTokenResponse>} A promise that resolves to an object containing the success status, message, and token data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find a reset password token in the database by its identifier. If the token is found, it returns the token data; otherwise, it returns an error message.
 */
export async function getResetPasswordTokenByIdentifier(
  identifier: string,
): Promise<ResetPasswordTokenResponse> {
  try {
    const resetPasswordToken = await prisma.resetPasswordToken.findFirst({
      where: {
        identifier: identifier,
      },
    });

    if (resetPasswordToken) {
      return {
        success: true,
        message: "Reset password token fetched successfully",
        token: resetPasswordToken,
      };
    }

    return {
      success: false,
      message: "Reset password token not found",
    };
  } catch (error) {
    console.error("Error fetching reset password token:", error);
    return {
      success: false,
      message: "Failed to fetch reset password token",
      error: error,
    };
  }
}

/**
 * Creates a new reset password token in the database.
 * @param {Object} tokenData - The data for the reset password token to create.
 * @param {string} tokenData.identifier - The identifier for the reset password token.
 * @param {string} tokenData.token - The token string.
 * @param {Date} tokenData.expires - The expiration date of the token.
 * @returns {Promise<ResetPasswordTokenResponse>} A promise that resolves to an object containing the success status, message, and created token data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to create a new reset password token in the database. It returns the created token data.
 */
export async function createResetPasswordToken(tokenData: {
  identifier: string;
  token: string;
  expires: Date;
}): Promise<ResetPasswordTokenResponse> {
  try {
    const createdToken = await prisma.resetPasswordToken.create({
      data: {
        identifier: tokenData.identifier,
        token: tokenData.token,
        expires: tokenData.expires,
      },
    });

    return {
      success: true,
      message: "Reset password token created successfully",
      token: createdToken,
    };
  } catch (error) {
    console.error("Error creating reset password token:", error);
    return {
      success: false,
      message: "Failed to create reset password token",
      error: error,
    };
  }
}

/**
 * Deletes a reset password token by its identifier.
 * @param {string} identifier - The identifier of the reset password token to delete.
 * @returns {Promise<BaseResponse>} A promise that resolves to an object containing the success status and message or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to delete a reset password token from the database by its identifier. It returns a success message if the deletion is successful.
 */
export async function deleteResetPasswordToken(
  identifier: string,
): Promise<BaseResponse> {
  try {
    await prisma.resetPasswordToken.deleteMany({
      where: {
        identifier: identifier,
      },
    });

    return {
      success: true,
      message: "Reset password token deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting reset password token:", error);
    return {
      success: false,
      message: "Failed to delete reset password token",
      error: error,
    };
  }
}
