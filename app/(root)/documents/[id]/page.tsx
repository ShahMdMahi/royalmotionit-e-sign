import { auth } from "@/auth";
import { SingleDocumentComponent } from "@/components/root/single-document";
import { prisma } from "@/prisma/prisma";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { normalizeDatabaseDocument } from "@/actions/document-normalizers";

export default async function SingleDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session) {
    if (session.user.id) {
      const id = (await params).id;
      try {
        // Check if user has direct access or team-based access
        const document = await prisma.document.findFirst({
          where: {
            id: id,
            OR: [
              { authorId: session.user.id },
              { signers: { some: { email: session.user.email ?? "" } } },
            ],
          },
          include: {
            signers: true,
          },
        });

        if (!document) {
          toast.error("Document not found or you do not have access to it.");
          redirect("/documents");
          return;
        } // Get the author
        const author = await prisma.user.findUnique({
          where: { id: document.authorId },
        });
        if (!author) {
          toast.error("Document author not found");
          redirect("/documents");
          return;
        }

        // Normalize the document to fix null/undefined type issues
        const normalizedDocument = await normalizeDatabaseDocument(document);

        // Convert the normalized document back to the expected format for SingleDocumentComponent
        const documentForComponent = {
          ...document, // Keep all original Prisma fields
          // Apply fixes for the fields that need type conversion
          signers: normalizedDocument.signers?.map((signer) => ({
            ...signer,
            name: signer.name,
            role: signer.role,
          })) || [],
        };

        // Return the document with author and signers data
        return (
          <SingleDocumentComponent
            document={documentForComponent}
            author={author}
          />
        );
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
