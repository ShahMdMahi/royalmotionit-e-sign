"use server";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/schema";
import { prisma } from "@/prisma/prisma";
import bcryptjs from "bcryptjs";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { error } from "console";

// Types for form states
type RegisterFormState = {
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string | null;
  success?: boolean;
};

type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string | null;
  success?: boolean;
};

type ForgotPasswordFormState = {
  errors?: {
    email?: string[];
  };
  message?: string | null;
  success?: boolean;
};

type ResetPasswordFormState = {
  errors?: {
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string | null;
  success?: boolean;
};

/**
 * Register a new user
 */
export async function registerUser(prevState: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  // Validate form fields
  const validatedFields = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
      success: false,
    };
  }

  const { firstName, lastName, email, password } = validatedFields.data;

  try {
    // Normalize email to lowercase
    const emailLower = email.toLowerCase();

    // Check if the email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return {
        errors: { email: ["Email already registered"] },
        message: "Email already registered",
        success: false,
      };
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create a new user in the database
    const newUser = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: emailLower,
        password: hashedPassword,
      },
    });

    // Check if the user was created successfully
    if (!newUser) {
      return {
        message: "Registration failed. Please try again.",
        success: false,
      };
    }

    // Send a welcome email
    // TODO: Implement email sending logic

    return {
      message: "Registration successful!",
      success: true,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      message: "An error occurred during registration. Please try again.",
      success: false,
    };
  }
}

/**
 * Authenticate a user
 */
export async function loginUser(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  // Validate form fields
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // Normalize email to lowercase
    const emailLower = email.toLowerCase();

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return {
        errors: { email: ["User not found"] },
        message: "User not found",
        success: false,
      };
    }

    // Check if the user has a password set
    if (!user.password) {
      return {
        errors: { password: ["Invalid password"] },
        message: "Invalid password",
        success: false,
      };
    }

    // Check if the password is correct
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        errors: { password: ["Invalid password"] },
        message: "Invalid password",
        success: false,
      };
    }

    // Use NextAuth's signIn function to authenticate the user
    const res = await signIn("credentials", {
      email: emailLower,
      password: password,
      redirect: false,
    });

    if (res?.error) {
      return {
        message: "Login failed. Please check your credentials.",
        success: false,
      };
    }

    return {
      message: "Login successful!",
      success: true,
    };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            errors: { password: ["Invalid credentials"] },
            message: "Invalid credentials",
            success: false,
          };
        default:
          return {
            message: "An error occurred during login. Please try again.",
            success: false,
          };
      }
    }
    return {
      message: "An error occurred during login. Please try again.",
      success: false,
    };
  }
}

/**
 * Forgot a user's password
 */
export async function forgotPassword(prevState: ForgotPasswordFormState, formData: FormData): Promise<ForgotPasswordFormState> {
  // Validate form fields
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please enter a valid email address.",
      success: false,
    };
  }

  const { email } = validatedFields.data;

  try {
    //TODO: Implement password reset logic
    console.log("Forgoting password:", email);
    return {
      message: "If an account with that email exists, we've sent a password reset link.",
      success: true,
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      message: "An error occurred. Please try again.",
      success: false,
    };
  }
}

/**
 * Reset a user's password
 */
export async function resetPassword(token: string, prevState: ResetPasswordFormState, formData: FormData): Promise<ResetPasswordFormState> {
  // Validate form fields
  const validatedFields = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
      success: false,
    };
  }

  const { password } = validatedFields.data;

  try {
    //TODO: Implement reset password logic
    console.log("Resetting password:", { token, password });
    return {
      message: "Your password has been reset successfully.",
      success: true,
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      message: "An error occurred. Please try again.",
      success: false,
    };
  }
}

/**
 * Log out a user
 */
export async function logoutUser(): Promise<void> {
  //TODO: Implement logout logic
}

/**
 * Authenticate with Google
 */
export async function googleAuth(): Promise<void> {
  //TODO: Implement Google authentication logic
}
