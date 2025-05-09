import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AdminSettingsComponent } from "@/components/admin/admin-settings";

export const metadata: Metadata = {
  title: "Settings - Admin - Royal Sign - RoyalMotionIT",
  description: "Settings for managing administrative tasks in Royal Sign e-signature application.",
};

export default async function AdminSettings() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    return <AdminSettingsComponent />;
  } else {
    redirect("/");
  }
}
