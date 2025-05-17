import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Royal Sign - RoyalMotionIT",
  description:
    "Secure authentication portal for Royal Sign, providing access to electronic signature and document management services developed by RoyalMotionIT",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) {
    return <>{children}</>;
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    redirect("/admin/dashboard");
  } else {
    redirect("/");
  }
}
