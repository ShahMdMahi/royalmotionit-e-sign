import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { redirect } from "next/navigation";
import { DocumentField } from "@/types/document";
import { normalizeDatabaseDocument } from "@/actions/document-normalizers";
import { SignDocumentClientWrapper } from "@/components/document/sign-document-client-wrapper";
import { DocumentType } from "@prisma/client";

export default async function SignDocument({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user.id || !session.user.email) {
    redirect("/auth/login");
  }

  const id = (await params).id;

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
      redirect("/documents");
    }

    if (prismaDocument.type === DocumentType.SIGNED) {
      setTimeout(() => {
        redirect(`/documents/${id}`);
      }, 10000);
    }

    // Normalize the document to handle null vs undefined differences
    const normalizedDoc = await normalizeDatabaseDocument(prismaDocument);

    // Get the single signer for this document
    // In a single signer system, there's only one signer per document
    const signer = prismaDocument.signers?.[0];

    // Check if the current user is the authorized signer
    if (!signer || signer.email.toLowerCase() !== (session.user.email || "").toLowerCase()) {
      redirect("/documents");
    }

    // // Check if document is ready for signing
    // if (normalizedDoc.status !== "PENDING") {
    //   redirect(`/documents/${id}`);
    // }

    // Sequential signing check is no longer needed in a single-signer system
    // Since there's only one signer, they're always the next in line to sign

    // Update signer status to VIEWED if not already and make sure userId is connected
    if ((signer.status === "PENDING" && !signer.viewedAt) || !signer.userId) {
      await prisma.signer.update({
        where: { id: signer.id },
        data: {
          status: "VIEWED",
          viewedAt: new Date(),
          // Always ensure the user ID is linked when viewing the document
          userId: session.user.id,
        },
      });

      // Make sure all fields are properly assigned to this signer
      const unassignedFields = prismaDocument.fields.filter((f) => !f.signerId);
      if (unassignedFields.length > 0) {
        for (const field of unassignedFields) {
          await prisma.documentField.update({
            where: { id: field.id },
            data: { signerId: signer.id },
          });
        }
        console.log(`Assigned ${unassignedFields.length} unassigned fields to signer ${signer.id}`);
      }

      // Record in document history
      await prisma.documentHistory.create({
        data: {
          documentId: prismaDocument.id,
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
    const fields = normalizedDoc.fields || [];
    console.log(`Total fields in document: ${fields.length}`);
    console.log(`Signer ID: ${signer.id}`);
    console.log(`Fields with signer ID assigned: ${fields.filter((field) => field.signerId).length}`);

    const signerFields = fields
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

    // Prepare document for the component with the expected structure
    // The SignDocumentComponent expects the document to have a signers array
    const documentForComponent = {
      ...prismaDocument,
      fields: normalizedDoc.fields,
      signers: [signer], // Pass as an array with the single signer
    };

    // Return the client wrapper component with the properly structured data
    return <SignDocumentClientWrapper document={documentForComponent} signer={signer} fields={signerFields} />;
  } catch (error) {
    console.error("Error fetching document for signing:", error);
    redirect("/documents");
  }
}
