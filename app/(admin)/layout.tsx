import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { AdminNavbar } from "@/components/admin/admin-navbar";

export const metadata: Metadata = {
  title: "Admin - Royal Sign - RoyalMotionIT",
  description: "Administrative dashboard for Royal Sign e-signature application. Manage documents, users, and system settings.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    return (
      <>
        <AdminNavbar />
        {children}
      </>
    );
  } else {
    redirect("/");
  }
}
