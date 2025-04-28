import { auth } from "@/auth";
import { SingleDocumentComponent } from "@/components/admin/single-document";
import { prisma } from "@/prisma/prisma";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function SignleDocument({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    const id = (await params).id;
    try {
      const document = await prisma.document.findUnique({ where: { id: id } });

      let author = null;
      if (document?.authorId) {
        author = await prisma.user.findUnique({
          where: { id: document.authorId },
        });
      }

      let signee = null;
      if (document?.signeeId) {
        signee = await prisma.user.findUnique({
          where: { id: document.signeeId },
        });
      }

      return <SingleDocumentComponent document={document} author={author} signee={signee} />;
    } catch (error) {
      console.error("Error fetching document:", error);
      redirect("/admin/documents");
    }
  } else {
    redirect("/");
  }
}
