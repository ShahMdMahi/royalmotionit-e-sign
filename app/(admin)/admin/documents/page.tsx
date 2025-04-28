import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DocumentComponent } from "@/components/admin/document";
import { prisma } from "@/prisma/prisma";

export const metadata: Metadata = {
  title: "Documents - Admin - Royal Sign - RoyalMotionIT",
  description: "Documents for managing administrative tasks in Royal Sign e-signature application.",
};

export default async function AdminDocuments() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    const documents = await prisma.document.findMany();
    const users = await prisma.user.findMany();
    return <DocumentComponent documents={documents} users={users} />; 
  } else {
    redirect("/");
  }
}
