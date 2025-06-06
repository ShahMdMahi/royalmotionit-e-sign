import { auth } from "@/auth";
import { EditDocumentComponent } from "@/components/admin/edit-document";
import { prisma } from "@/prisma/prisma";
import { DocumentType, Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function EditDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    const id = (await params).id;
    try {
      const document = await prisma.document.findUnique({ where: { id } });

      if (!document) {
        redirect("/admin/documents");
      }

      if (
        document.documentType !== DocumentType.UNSIGNED ||
        document.status !== "DRAFT"
      ) {
        redirect(`/admin/documents/${id}`);
      }

      return <EditDocumentComponent document={document} />;
    } catch (error) {
      // Check if the error is a Next.js redirect (which is expected behavior in some cases)
      if (error instanceof Error && error.message === "NEXT_REDIRECT") {
        throw error; // Let Next.js handle the redirect
      }

      console.error("Error fetching document:", error);
      redirect("/admin/documents");
    }
  } else {
    redirect("/");
  }
}
