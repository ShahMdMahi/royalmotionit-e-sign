import { auth } from "@/auth";
import { EditDocumentComponent } from "@/components/document/edit-document-proxy";
import { prisma } from "@/prisma/prisma";
import { DocumentType } from "@prisma/client";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { Document } from "@/types/document";

export default async function EditDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || !session.user.id) {
    redirect("/auth/login");
  }

  const id = (await params).id;

  try {
    // Verify that the document exists and the current user is the author
    const document = await prisma.document.findFirst({
      where: {
        id: id,
        authorId: session.user.id,
      },
      include: {
        signers: true,
        fields: true,
      },
    });

    if (!document) {
      toast.error("Document not found or you don't have permission to edit it");
      redirect("/documents");
    }

    // Verify that the document is in a state that can be edited
    if (
      document.documentType !== DocumentType.UNSIGNED ||
      document.status !== "DRAFT"
    ) {
      toast.error("Only draft documents can be edited");
      redirect(`/documents/${id}`);
    }

    // Document exists and is editable
    // Map the Prisma document to the expected Document type
    const documentForEdit: Document = {
      id: document.id,
      title: document.title,
      description: document.description || undefined,
      authorId: document.authorId,
      status: document.status,
      key: document.key || "",
      type: document.type || "default",
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      preparedAt: document.preparedAt || undefined,
      sentAt: document.sentAt || undefined,
      signedAt: document.signedAt || undefined,
      expiresAt: document.expiresAt || undefined,
      enableWatermark: document.enableWatermark || false,
      watermarkText: document.watermarkText || undefined,
      fields: document.fields?.map((field) => ({
        id: field.id,
        documentId: field.documentId,
        type: field.type as any, // Cast to the appropriate DocumentFieldType
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
      })),
      signers:
        document.signers?.map((signer) => ({
          id: signer.id,
          documentId: signer.documentId,
          email: signer.email,
          name: signer.name || undefined,
          role: signer.role || undefined,
          order: (signer as any).order ?? 0,
          status: signer.status,
          accessCode: signer.accessCode || undefined,
          invitedAt: signer.invitedAt || undefined,
          viewedAt: signer.viewedAt || undefined,
          completedAt: signer.completedAt || undefined,
          notifiedAt: signer.notifiedAt || undefined,
          declinedAt: signer.declinedAt || undefined,
          declineReason: signer.declineReason || undefined,
        })) || [],
    };

    return <EditDocumentComponent document={documentForEdit} />;
  } catch (error) {
    console.error("Error fetching document:", error);
    toast.error("Error loading document for editing");
    redirect("/documents");
  }
}
