"use server";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/schema";
import { prisma } from "@/prisma/prisma";
import bcryptjs from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { generateVerificationToken } from "@/lib/token";
import { sendAccountVerificationEmail, sendWelcomeEmail } from "@/actions/email";
import { get } from "@vercel/edge-config";

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
  const isRegistrationActive = await get("REGISTRATION_ACTIVE");
  if (!isRegistrationActive) {
    return {
      message: "Registration is not active. Contact support for more information.",
      success: false,
    };
  }

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
    await sendWelcomeEmail(`${firstName} ${lastName}`, emailLower);

    // Generate a verification email token
    const verificationToken = await generateVerificationToken(emailLower);

    // Send a verification email
    if (verificationToken.verificationToken?.token) {
      await sendAccountVerificationEmail(`${firstName} ${lastName}`, emailLower, verificationToken.verificationToken?.token);
    }

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
        case "AccessDenied":
          return {
            message: "Access denied. Please check your permissions or verify your email.",
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
  try {
    await signOut({ redirectTo: "/" });
  } catch (error) {
    console.error("Logout error:", error);
  }
}

/**
 * Authenticate with Google
 */
export async function googleAuth(): Promise<{ redirectUrl?: string; message?: string }> {
  try {
    const isGoogleAuthActive = await get("GOOGLE_AUTH_ACTIVE");
    if (!isGoogleAuthActive) {
      console.error("Google authentication is not enabled.");
      return { message: "Google authentication is not enabled. Contact support for more information." };
    }
    const result = await signIn("google", {
      redirect: false,
      callbackUrl: "/dashboard",
    });

    console.log("Google auth result:", result);

    // Check if the result is a string (direct URL) or an object with a url property
    if (typeof result === "string") {
      return { redirectUrl: result };
    } else if (result?.url) {
      return { redirectUrl: result.url };
    } else {
      console.error("No redirect URL returned from Google auth");
      return {};
    }
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("Google authentication error:", error);
      return {};
    }
    console.error("An error occurred during Google authentication:", error);
    return {};
  }
}

/**
 * Verify User Email
 */
export async function verifyUserEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { token },
    });

    if (!verificationToken) {
      return {
        success: false,
        message: "Invalid or expired verification token.",
      };
    }

    const hashExpired = verificationToken.expires < new Date(Date.now());

    if (hashExpired) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      return {
        success: false,
        message: "Verification token has expired.",
      };
    }

    const verifiedUser = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date(Date.now()) },
    });

    if (!verifiedUser) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return {
      success: true,
      message: "Email verified successfully.",
    };
  } catch (error) {
    console.error("Error verifying email:", error);
    return {
      success: false,
      message: "Error verifying email. Please try again.",
    };
  }
}
