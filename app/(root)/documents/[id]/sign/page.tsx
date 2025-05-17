import { auth } from "@/auth";
import { SignDocumentComponent } from "@/components/document";
import { prisma } from "@/prisma/prisma";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { DocumentField } from "@/types/document";
import { normalizeDatabaseDocument } from "@/actions/document-normalizers";

export default async function SignDocument({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session || !session.user.id || !session.user.email) {
    redirect("/auth/login");
  }

  const { id } = params;

  try {
    // Find the document and check if this user is a signer
    const prismaDocument = await prisma.document.findUnique({
      where: {
        id: id,
      },
      include: {
        signers: true,
        fields: true,
      },
    });

    if (!prismaDocument) {
      toast.error("Document not found");
      redirect("/documents");
    }

    // Normalize the document to handle null vs undefined differences
    const document = await normalizeDatabaseDocument(prismaDocument); // Find the signer associated with this user's email
    const signer = document.signers.find(
      (s) => s.email.toLowerCase() === (session.user.email || "").toLowerCase(),
    );

    if (!signer) {
      toast.error("You are not authorized to sign this document");
      redirect("/documents");
    }

    // Check if document is ready for signing
    if (document.status !== "PENDING") {
      toast.error("This document is not available for signing");
      redirect(`/documents/${id}`);
    }

    // If sequential signing is enabled, check if it's this signer's turn
    if (document.sequentialSigning) {
      // Get the lowest order signer who hasn't completed yet
      const nextSigner = document.signers
        .filter((s) => s.status !== "COMPLETED")
        .sort((a, b) => a.order - b.order)[0];

      if (nextSigner?.id !== signer.id) {
        toast.error("It's not your turn to sign this document yet");
        redirect(`/documents/${id}`);
      }
    }

    // Update signer status to VIEWED if not already
    if (signer.status === "PENDING" && !signer.viewedAt) {
      await prisma.signer.update({
        where: { id: signer.id },
        data: {
          status: "VIEWED",
          viewedAt: new Date(),
        },
      });

      // Record in document history
      await prisma.documentHistory.create({
        data: {
          documentId: document.id,
          action: "VIEWED",
          actorEmail: session.user.email,
          actorName: session.user.name || undefined,
          actorRole: "SIGNER",
          ipAddress: "Not collected", // In a real app, you would get this from the request
          userAgent: "Not collected", // In a real app, you would get this from the request
        },
      });
    }
    // Get only the fields assigned to this signer and map them to DocumentField type
    const signerFields = document.fields
      .filter((field) => field.signerId === signer.id)
      .map((field) => {
        // Convert Prisma DocumentField to our application DocumentField type
        return {
          id: field.id,
          documentId: field.documentId,
          type: field.type as DocumentField["type"],
          label: field.label,
          required: field.required,
          placeholder: field.placeholder || undefined,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          pageNumber: field.pageNumber,
          value: field.value || undefined,
          signerId: field.signerId || undefined,
          color: field.color || undefined,
          fontFamily: field.fontFamily || undefined,
          fontSize: field.fontSize || undefined,
          validationRule: field.validationRule || undefined,
          conditionalLogic: field.conditionalLogic || undefined,
          options: field.options || undefined,
          backgroundColor: field.backgroundColor || undefined,
          borderColor: field.borderColor || undefined,
          textColor: field.textColor || undefined,
        } as DocumentField;
      });
    // Ensure we have document in the expected format for the component
    return (
      <SignDocumentComponent
        document={document}
        signer={signer}
        fields={signerFields}
      />
    );
  } catch (error) {
    console.error("Error fetching document for signing:", error);
    toast.error("Error loading document for signing");
    redirect("/documents");
  }
}
