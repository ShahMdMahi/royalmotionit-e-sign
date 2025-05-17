import { prisma } from "@/prisma/prisma";
import { Account } from "@prisma/client";

// Define interfaces for return types
interface BaseResponse {
  success: boolean;
  message: string;
  error?: unknown;
}

interface AccountResponse extends BaseResponse {
  account?: Account;
}

/**
 * Retrieves an account by its user ID from the database using Prisma.
 * @param {string} userId - The ID of the user whose account to retrieve.
 * @returns {Promise<AccountResponse>} A promise that resolves to an object containing the success status, message, and account data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find an account in the database by its user ID. If the account is found, it returns the account data; otherwise, it returns an error message.
 */
export async function getAccountByUserId(
  userId: string,
): Promise<AccountResponse> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
      },
    });

    if (account) {
      return {
        success: true,
        message: "Account fetched successfully",
        account: account,
      };
    }

    return {
      success: false,
      message: "Account not found",
    };
  } catch (error) {
    console.error("Error fetching account by user ID:", error);
    return {
      success: false,
      message: "Failed to fetch account",
      error: error,
    };
  }
}

/**
 * Retrieves an account by its ID from the database using Prisma.
 * @param {string} accountId - The ID of the account to retrieve.
 * @returns {Promise<AccountResponse>} A promise that resolves to an object containing the success status, message, and account data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find an account in the database by its ID. If the account is found, it returns the account data; otherwise, it returns an error message.
 */
export async function getAccountById(
  accountId: string,
): Promise<AccountResponse> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
      },
    });

    if (account) {
      return {
        success: true,
        message: "Account fetched successfully",
        account: account,
      };
    }

    return {
      success: false,
      message: "Account not found",
    };
  } catch (error) {
    console.error("Error fetching account by ID:", error);
    return {
      success: false,
      message: "Failed to fetch account",
      error: error,
    };
  }
}

/**
 * Deletes an account by its user ID from the database using Prisma.
 * @param {string} userId - The ID of the user whose account to delete.
 * @returns {Promise<BaseResponse>} A promise that resolves to an object containing the success status, message, and error information if applicable.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find and delete an account in the database by its user ID. If the account is found and deleted, it returns a success message; otherwise, it returns an error message.
 */
export async function deleteAccountByUserId(
  userId: string,
): Promise<BaseResponse> {
  try {
    const deleteResult = await prisma.account.deleteMany({
      where: {
        userId: userId,
      },
    });

    if (deleteResult.count > 0) {
      return {
        success: true,
        message: "Account deleted successfully",
      };
    }
    return {
      success: false,
      message: "Account not found",
    };
  } catch (error) {
    console.error("Error deleting account by user ID:", error);
    return {
      success: false,
      message: "Failed to delete account",
      error: error,
    };
  }
}

/**
 * Updates specific fields of an account by its ID in the database using Prisma.
 * @param {string} accountId - The ID of the account to update.
 * @param {Partial<Account>} data - The data to update the account with.
 * @returns {Promise<AccountResponse>} A promise that resolves to an object containing the success status, message, and updated account data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find and update an account in the database by its ID. If the account is found and updated, it returns the updated account data; otherwise, it returns an error message.
 */
export async function updateAccountById(
  accountId: string,
  data: Partial<Account>,
): Promise<AccountResponse> {
  try {
    const account = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: data,
    });

    if (account) {
      return {
        success: true,
        message: "Account updated successfully",
        account: account,
      };
    }

    return {
      success: false,
      message: "Account not found",
    };
  } catch (error) {
    console.error("Error updating account by ID:", error);
    return {
      success: false,
      message: "Failed to update account",
      error: error,
    };
  }
}
