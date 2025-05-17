import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { DocumentPreview } from "@/components/document/document-preview";
import { getDocumentFields } from "@/actions/document";
import { normalizeDatabaseDocument } from "@/actions/document-normalizers";

export default async function AdminDocumentPreview({
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
      // Fetch document with signers
      const prismaDocument = await prisma.document.findUnique({
        where: { id },
        include: { signers: true },
      });

      if (!prismaDocument) {
        redirect("/admin/documents");
      } // Normalize the document to handle null vs undefined differences
      const document = await normalizeDatabaseDocument(prismaDocument); // Fetch fields separately
      const fieldsResult = await getDocumentFields(id);
      // Convert field types to ensure DocumentFieldType compatibility
      const fields = fieldsResult.success
        ? (fieldsResult.fields || []).map((field) => ({
            ...field,
            type: field.type as import("@/types/document").DocumentFieldType,
            placeholder: field.placeholder ?? undefined,
            value: field.value ?? undefined,
            signerId: field.signerId ?? undefined,
            color: field.color ?? undefined,
            fontFamily: field.fontFamily ?? undefined,
            validationRule: field.validationRule ?? undefined,
            conditionalLogic: field.conditionalLogic ?? undefined,
            options: field.options ?? undefined,
            backgroundColor: field.backgroundColor ?? undefined,
            borderColor: field.borderColor ?? undefined,
            textColor: field.textColor ?? undefined,
            fontSize: field.fontSize ?? undefined,
          }))
        : [];

      return <DocumentPreview document={document} fields={fields} />;
    } catch (error) {
      console.error("Error fetching document for preview:", error);
      redirect(`/admin/documents/${id}`);
    }
  } else {
    redirect("/");
  }
}
