import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DocumentsComponent } from "@/components/root/documents";
import { prisma } from "@/prisma/prisma";
import { Role } from "@prisma/client";

export const metadata: Metadata = {
  title: "Documents - Royal Sign - RoyalMotionIT",
  description: "User documents for Royal Sign e-signature application.",
};

export default async function Documents() {
  const session = await auth();
  if (session) {
    if (session.user.id) {
      if (session.user.role === Role.ADMIN) {
        const authorDocuments = await prisma.document.findMany({
          where: {
            authorId: session.user.id,
          },
        });
        const signeeDocuments = await prisma.document.findMany({
          where: {
            signeeId: session.user.id,
          },
        });

        return <DocumentsComponent userRole={session.user.role as Role} user={session.user} authorDocuments={authorDocuments} signeeDocuments={signeeDocuments} />;
      } else {
        const signeeDocuments = await prisma.document.findMany({
          where: {
            signeeId: session.user.id,
          },
        });

        // Pass an empty array for authorDocuments for non-admin users
        return <DocumentsComponent userRole={session.user.role as Role} user={session.user} authorDocuments={[]} signeeDocuments={signeeDocuments} />;
      }
    }
  } else {
    redirect("/auth/login");
  }
}
