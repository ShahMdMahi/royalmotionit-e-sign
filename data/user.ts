import { prisma } from "@/prisma/prisma";
import { Role, User } from "@prisma/client";

// Define interfaces for return types
interface BaseResponse {
  success: boolean;
  message: string;
  error?: unknown;
}

interface UserResponse extends BaseResponse {
  user?: User;
}

/**
 * Retrieves a user by their ID from the database using Prisma.
 * @param {string} id - The ID of the user to retrieve.
 * @returns {Promise<UserResponse>} A promise that resolves to an object containing the success status, message, and user data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find a user in the database by their ID. If the user is found, it returns the user data; otherwise, it returns an error message.
 */
export async function getUserById(id: string): Promise<UserResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (user) {
      return {
        success: true,
        message: "User fetched successfully",
        user: user,
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return {
      success: false,
      message: "Failed to fetch user",
      error: error,
    };
  }
}

/**
 * Retrieves a user by their email from the database using Prisma.
 * @param {string} email - The email of the user to retrieve.
 * @returns {Promise<UserResponse>} A promise that resolves to an object containing the success status, message, and user data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find a user in the database by their email. If the user is found, it returns the user data; otherwise, it returns an error message.
 */
export async function getUserByEmail(email: string): Promise<UserResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      return {
        success: true,
        message: "User fetched successfully",
        user: user,
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return {
      success: false,
      message: "Failed to fetch user",
      error: error,
    };
  }
}

/**
 * Updates a user's name by their ID in the database using Prisma.
 * @param {string} id - The ID of the user whose name to update.
 * @param {string} name - The new name for the user.
 * @returns {Promise<UserResponse>} A promise that resolves to an object containing the success status, message, and updated user data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to update a user's name in the database by their ID. If the update is successful, it returns the updated user data; otherwise, it returns an error message.
 * */
export async function updateUserName(id: string, name: string): Promise<UserResponse> {
  try {
    const user = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        name: name,
      },
    });

    if (user) {
      return {
        success: true,
        message: "User updated successfully",
        user: user,
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error updating user name:", error);
    return {
      success: false,
      message: "Failed to update user",
      error: error,
    };
  }
}

/**
 * Updates a user's password by their ID in the database using Prisma.
 * @param {string} id - The ID of the user whose password to update.
 * @param {string} password - The new password for the user.
 * @returns {Promise<UserResponse>} A promise that resolves to an object containing the success status, message, and updated user data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to update a user's password in the database by their ID. If the update is successful, it returns the updated user data; otherwise, it returns an error message.
 */
export async function updateUserPassword(id: string, password: string): Promise<UserResponse> {
  try {
    const user = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        password: password,
      },
    });

    if (user) {
      return {
        success: true,
        message: "User updated successfully",
        user: user,
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error updating user password:", error);
    return {
      success: false,
      message: "Failed to update user",
      error: error,
    };
  }
}

/**
 * Updates a user's role by their ID in the database using Prisma.
 * @param {string} id - The ID of the user whose role to update.
 * @param {Role} role - The new role for the user.
 * @returns {Promise<UserResponse>} A promise that resolves to an object containing the success status, message, and updated user data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to update a user's role in the database by their ID. If the update is successful, it returns the updated user data; otherwise, it returns an error message.
 */
export async function updateUserRole(id: string, role: Role): Promise<UserResponse> {
  try {
    const user = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        role: role,
      },
    });

    if (user) {
      return {
        success: true,
        message: "User updated successfully",
        user: user,
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      message: "Failed to update user",
      error: error,
    };
  }
}

/**
 * Updates a user's image by their ID in the database using Prisma.
 * @param {string} id - The ID of the user whose image to update.
 * @param {string} image - The new image URL for the user.
 * @returns {Promise<UserResponse>} A promise that resolves to an object containing the success status, message, and updated user data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to update a user's image in the database by their ID. If the update is successful, it returns the updated user data; otherwise, it returns an error message.
 */
export async function updateUserImage(id: string, image: string): Promise<UserResponse> {
  try {
    const user = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        image: image,
      },
    });

    if (user) {
      return {
        success: true,
        message: "User updated successfully",
        user: user,
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error updating user image:", error);
    return {
      success: false,
      message: "Failed to update user",
      error: error,
    };
  }
}

/**
 * Updates multiple user fields by their ID in the database using Prisma.
 * @param {string} id - The ID of the user to update.
 * @param {Partial<User>} data - The data to update the user with.
 * @returns {Promise<UserResponse>} A promise that resolves to an object containing the success status, message, and updated user data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to update multiple user fields in the database by their ID. If the update is successful, it returns the updated user data; otherwise, it returns an error message.
 */
export async function updateUser(id: string, data: Partial<User>): Promise<UserResponse> {
  try {
    const user = await prisma.user.update({
      where: {
        id: id,
      },
      data: data,
    });

    if (user) {
      return {
        success: true,
        message: "User updated successfully",
        user: user,
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: "Failed to update user",
      error: error,
    };
  }
}

/**
 * Deletes a user by their ID from the database using Prisma.
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<BaseResponse>} A promise that resolves to an object containing the success status, message, and error information if applicable.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to delete a user from the database by their ID. If the deletion is successful, it returns a success message; otherwise, it returns an error message.
 */
export async function deleteUserById(id: string): Promise<BaseResponse> {
  try {
    await prisma.user.delete({
      where: {
        id: id,
      },
    });

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user by ID:", error);
    return {
      success: false,
      message: "Failed to delete user",
      error: error,
    };
  }
}

/**
 * Retrieves a user by their email and verifies it in the database using Prisma.
 * @param {string} email - The email of the user to retrieve and verify.
 * @returns {Promise<UserResponse>} A promise that resolves to an object containing the success status, message, and user data or error information.
 * @throws {Error} Throws an error if there is an issue with the database query.
 * @description This function uses Prisma to find a user in the database by their email and update the email verification date. If the user is found and updated, it returns the user data; otherwise, it returns an error message.
 */
export async function getUserByEmailAndVerify(email: string): Promise<UserResponse> {
  try {
    const user = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        emailVerified: new Date(),
      },
    });

    if (user) {
      return {
        success: true,
        message: "User email verified successfully",
        user: user,
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return {
      success: false,
      message: "Failed to fetch user",
      error: error,
    };
  }
}
