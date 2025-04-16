import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export const metadata: Metadata = {
  title: "Admin - Royal Sign - RoyalMotionIT",
  description: "Administrative dashboard for Royal Sign e-signature application. Manage documents, users, and system settings.",
};

declare module "next-auth" {
  interface User {
    role?: Role;
  }

  interface Session {
    user?: User;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session?.user?.role !== Role.ADMIN) {
    redirect("/");
  } else {
    return <>{children}</>;
  }
}
