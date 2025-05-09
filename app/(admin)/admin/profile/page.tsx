import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AdminProfileComponent } from "@/components/admin/admin-profile";

export const metadata: Metadata = {
  title: "Profile - Admin - Royal Sign - RoyalMotionIT",
  description: "Profile for managing administrative tasks in Royal Sign e-signature application.",
};

export default async function AdminProfile() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    return <AdminProfileComponent session={session} />;
  } else {
    redirect("/");
  }
}
