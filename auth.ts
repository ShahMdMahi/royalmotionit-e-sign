import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma/prisma";
import authConfig from "./auth.config";
import { JWT } from "next-auth/jwt";
import { sendAccountVerificationEmail } from "./actions/email";
import { generateVerificationToken } from "./lib/token";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isOauth: boolean;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      emailVerified?: Date | null;
      notification?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isOauth?: boolean;
    role?: string;
    notification?: boolean;
    emailVerified?: Date | null;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      if (!user.id) return false;

      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!existingUser?.emailVerified) {
        if (!existingUser?.email) return false;
        if (!existingUser?.name) return false;
        const verificationToken = await generateVerificationToken(existingUser.email);
        if (!verificationToken.verificationToken?.token) return false;
        await sendAccountVerificationEmail(existingUser.name, existingUser.email, verificationToken.verificationToken.token);
        return false;
      }

      return true;
    },
    async jwt({ token }) {
      if (!token.sub) return null;

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub },
      });

      if (!existingUser) return null;

      const existingAccount = await prisma.account.findFirst({
        where: {
          userId: existingUser.id,
        },
      });

      token.isOauth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.image = existingUser.image;
      token.role = existingUser.role;
      token.emailVerified = existingUser.emailVerified;
      token.notification = existingUser.notification;

      return token;
    },
    async session({ token, session }) {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.isOauth = token.isOauth as boolean;
        session.user.role = token.role as string;
        session.user.notification = token.notification as boolean;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
  },
});
