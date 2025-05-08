import { auth } from "@/auth";
import { SingleDocumentComponent } from "@/components/root/single-document";
import { prisma } from "@/prisma/prisma";
import { redirect } from "next/navigation";
import { toast } from "sonner";

export default async function SingleDocument({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session) {
    if (session.user.id) {
      const id = (await params).id;
      try {
        const document = await prisma.document.findUnique({
          where: {
            OR: [{ authorId: session.user.id }, { signeeId: session.user.id }],
            id: id,
          },
        });

        if (!document) {
          toast.error("Document not found or you do not have access to it.");
          redirect("/documents");
          return;
        }

        if (document.authorId && document.signeeId) {
          const author = await prisma.user.findUnique({
            where: { id: document.authorId },
          });
          const signee = await prisma.user.findUnique({
            where: { id: document.signeeId },
          });

          if (author && signee) {
            return <SingleDocumentComponent document={document} author={author} signee={signee} />;
          } else if (author) {
            return <SingleDocumentComponent document={document} author={author} />;
          }
        }

        return <SingleDocumentComponent document={document} />;
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Error fetching document. Please try again later.");
        redirect("/documents");
      }
    } else {
      redirect("/auth/login");
    }
  } else {
    redirect("/auth/login");
  }
}
