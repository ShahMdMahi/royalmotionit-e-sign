import { auth } from "@/auth";
import { SingleDocumentComponent } from "@/components/admin/single-document";
import { prisma } from "@/prisma/prisma";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function SingleDocument({
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
      const document = await prisma.document.findUnique({
        where: { id: id },
        include: { signers: true },
      });

      if (!document) {
        console.error(`Document with ID ${id} not found`);
        redirect("/admin/documents");
      }

      const author = await prisma.user.findUnique({
        where: { id: document.authorId },
      });

      if (!author) {
        console.error(
          `Author with ID ${document.authorId} not found for document ${id}`,
        );
        redirect("/admin/documents");
      }

      // All checks passed, render the component
      return <SingleDocumentComponent document={document} author={author} />;
    } catch (error) {
      console.error("Error fetching document:", error);
      redirect("/admin/documents");
    }
  } else {
    redirect("/");
  }
}
