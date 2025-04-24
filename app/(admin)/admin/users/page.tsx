import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/prisma/prisma";
import { UsersComponent } from "@/components/admin/users";

export const metadata: Metadata = {
  title: "Users - Admin - Royal Sign - RoyalMotionIT",
  description: "Users for managing administrative tasks in Royal Sign e-signature application.",
};

export default async function AdminUsers() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    const users = await prisma.user.findMany();
    return <UsersComponent users={users} />;
  } else {
    redirect("/");
  }
}
