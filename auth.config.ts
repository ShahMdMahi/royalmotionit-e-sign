import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { loginSchema } from "@/schema";
import { prisma } from "./prisma/prisma";
import bcryptjs from "bcryptjs";

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        // Validate credentials
        const validatedData = loginSchema.safeParse(credentials);

        // If validation fails, return null
        if (!validatedData.success) return null;

        // Extract validated data
        const { email, password } = validatedData.data;

        // Email Lowercase
        const emailLower = email.toLowerCase();

        // Check if user exists in the database
        const user = await prisma.user.findUnique({
          where: { email: emailLower },
        });

        // If user does not exist, return null
        if (!user || !user.email || !user.password) return null;

        // Check if the user has a password set
        const isPasswordValid = await bcryptjs.compare(password, user.password);

        // If password is valid, return user object
        if (isPasswordValid) {
          return user;
        }

        // If any of the checks fail, return null
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
} satisfies NextAuthConfig;
