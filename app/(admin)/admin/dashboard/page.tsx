import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AdminDashboardComponent } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Dashboard - Admin - Royal Sign - RoyalMotionIT",
  description: "Dashboard for managing administrative tasks in Royal Sign e-signature application.",
};

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    return <AdminDashboardComponent />;
  } else {
    redirect("/");
  }
}
