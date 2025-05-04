import { auth } from "@/auth";
import { EditDocumentComponent } from "@/components/admin/edit-document";
import { prisma } from "@/prisma/prisma";
import { DocumentType, Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function EditDocument({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    const id = (await params).id;
    try {
      const document = await prisma.document.findUnique({ where: { id } });

      // Fetch all users (for selecting signees)
      const users = await prisma.user.findMany({
        where: { role: Role.USER }, // Only regular users can be signees
        orderBy: { name: "asc" },
      });

      if (document) {
        if (document.documentType === DocumentType.UNSIGNED) {
          return <EditDocumentComponent document={document} users={users} />;
        } else {
          redirect(`/admin/documents/${id}`);
        }
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      redirect("/admin/documents");
    }
  } else {
    redirect("/");
  }
}
