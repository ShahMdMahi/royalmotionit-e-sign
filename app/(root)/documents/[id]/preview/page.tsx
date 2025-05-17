import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { redirect } from "next/navigation";
import { DocumentPreview } from "@/components/document/document-preview";
import { getDocumentFields } from "@/actions/document";
import { toast } from "sonner";
import { normalizeDatabaseDocument } from "@/actions/document-normalizers";

export default async function DocumentPreviewPage({
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
    // Check access to the document
    const prismaDocument = await prisma.document.findFirst({
      where: {
        id: id,
        OR: [
          { authorId: session.user.id },
          { signers: { some: { email: session.user.email ?? "" } } },
        ],
      },
      include: { signers: true },
    });

    if (!prismaDocument) {
      toast.error("Document not found or you don't have permission to view it");
      redirect("/documents");
    }

    // Normalize the document to handle null vs undefined differences
    const document = await normalizeDatabaseDocument(prismaDocument);

    // Fetch fields separately
    const fieldsResult = await getDocumentFields(id);

    // Normalize fields from Prisma to match DocumentField type
    const normalizedFields =
      fieldsResult.success && fieldsResult.fields
        ? fieldsResult.fields.map((field) => ({
            id: field.id,
            documentId: field.documentId,
            type: field.type as import("@/types/document").DocumentFieldType,
            label: field.label,
            required: field.required,
            placeholder: field.placeholder ?? undefined,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            pageNumber: field.pageNumber,
            value: field.value ?? undefined,
            signerId: field.signerId ?? undefined,
            color: field.color ?? undefined,
            fontFamily: field.fontFamily ?? undefined,
            fontSize: field.fontSize ?? undefined,
            validationRule: field.validationRule ?? undefined,
            conditionalLogic: field.conditionalLogic ?? undefined,
            options: field.options ?? undefined,
            backgroundColor: field.backgroundColor ?? undefined,
            borderColor: field.borderColor ?? undefined,
            textColor: field.textColor ?? undefined,
            createdAt: field.createdAt,
            updatedAt: field.updatedAt,
          }))
        : [];

    return <DocumentPreview document={document} fields={normalizedFields} />;
  } catch (error) {
    console.error("Error fetching document for preview:", error);
    toast.error("Error loading document preview");
    redirect(`/documents/${id}`);
  }
}
