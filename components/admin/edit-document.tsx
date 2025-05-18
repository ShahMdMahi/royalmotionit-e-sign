"use client";

import { Document as PrismaDocument } from "@prisma/client";
import { Document, DocumentFieldType } from "@/types/document";
import { useState, useEffect } from "react";
import { PageNavigation } from "@/components/document/page-navigation";
import { FieldPalette } from "@/components/document/field-palette";
import { DocumentToolbar } from "@/components/admin/document-toolbar";
import { PDFEditViewerSimple } from "@/components/document/pdf-edit-viewer-simple";
import { SignerManager } from "@/components/document/signer-manager";
import { useDocumentFields } from "@/hooks/use-document-fields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFromR2 } from "@/actions/r2";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { saveDocumentFields } from "@/actions/document";
import { useRouter } from "next/navigation";

interface EditDocumentComponentProps {
  document: PrismaDocument;
}

export function EditDocumentComponent({
  document,
}: EditDocumentComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState("fields");
  const [isSaving, setIsSaving] = useState(false);
  const [hasValidatedSigner, setHasValidatedSigner] = useState(false);

  const {
    fields,
    addField,
    updateField,
    deleteField,
    selectedField,
    selectField,
  } = useDocumentFields(document.id);

  const router = useRouter();

  // Fetch PDF data from R2
  useEffect(() => {
    const fetchPdf = async () => {
      if (!document.key) {
        toast.error("Document key is missing");
        return;
      }

      try {
        setIsLoading(true);
        const result = await getFromR2({
          Key: document.key,
        });

        if (result.success) {
          setPdfData(result.data.Body);
          setIsLoading(false);
        } else {
          toast.error("Failed to load document");
        }
      } catch (error) {
        console.error("Failed to fetch PDF:", error);
        toast.error("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdf();
  }, [document.key]);

  // Check if document has a valid signer when required
  const hasValidSigner = () => {
    // Find fields that require a signer (signature, initial)
    const signerRequiredFields = fields.filter((field) =>
      ["signature", "initial"].includes(field.type),
    );

    // If there are no signature/initial fields, we don't need a signer
    if (signerRequiredFields.length === 0) {
      console.log("No signature fields found, signer not required");
      return true;
    }

    // Check if at least one field has a signerId
    const fieldsWithSigner = signerRequiredFields.filter(
      (f) => f.signerId && f.signerId.trim() !== "",
    );

    const hasAssignedSigner = fieldsWithSigner.length > 0;

    console.log("Signature validation check:");
    console.log("- Total signature fields found:", signerRequiredFields.length);
    console.log("- Fields with signer assignments:", fieldsWithSigner.length);
    signerRequiredFields.forEach((field) => {
      console.log(
        `  Field ID: ${field.id}, Type: ${field.type}, SignerId: ${field.signerId || "MISSING"}`,
      );
    });

    return hasAssignedSigner;
  };

  // Handle save
  const handleSave = async () => {
    try {
      // Check if there are any fields to save
      if (fields.length === 0) {
        setActiveTab("fields");
        toast.error(
          "Please add at least one field before saving the document",
          {
            description: "Your document needs at least one field to be useful",
            action: {
              label: "Add Fields",
              onClick: () => setActiveTab("fields"),
            },
          },
        );
        return;
      }

      // Validate signer before saving if there are signature fields
      if (!hasValidSigner()) {
        setActiveTab("signers");
        toast.error("Please add a signer before saving the document", {
          description:
            "Document includes signature fields which require a signer",
          action: {
            label: "Add Signer",
            onClick: () => setActiveTab("signers"),
          },
        });
        setHasValidatedSigner(true);
        return;
      }

      setIsSaving(true);

      // Save fields to database
      const result = await saveDocumentFields(document.id, fields);

      if (result.success) {
        toast.success("Document saved successfully");

        // If the document was in DRAFT status, update UI
        router.refresh();
      } else {
        toast.error(result.message || "Failed to save document");
      }
    } catch (error) {
      console.error("Failed to save document:", error);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !pdfData) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DocumentToolbar
        document={
          {
            ...document,
            type: "default", // Add the missing type property
            signer: undefined, // Set empty signer to satisfy Document type
          } as Document
        }
        onSaveAction={async (doc) => {
          await handleSave();
          return doc as Document;
        }}
        isSaving={isSaving}
        fields={fields}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
        {/* Left sidebar */}
        <div className="flex flex-col space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="signers">Signers</TabsTrigger>
            </TabsList>
            <TabsContent value="fields" className="w-full">
              <FieldPalette
                currentPage={currentPage}
                onAddFieldAction={async (
                  fieldType: DocumentFieldType,
                  pageNumber?: number,
                ) => {
                  // Add the field first
                  addField(fieldType, pageNumber ?? currentPage);

                  // If adding a signature or initial field, check if we have a signer
                  if (
                    ["signature", "initial"].includes(fieldType) &&
                    !hasValidSigner() &&
                    !hasValidatedSigner
                  ) {
                    // Prompt the user to add a signer
                    toast.info("Signature field added", {
                      description:
                        "Remember to add a signer for signature fields",
                      action: {
                        label: "Add Signer",
                        onClick: () => setActiveTab("signers"),
                      },
                    });
                    setHasValidatedSigner(true);
                  }

                  return { fieldType, pageNumber: pageNumber ?? currentPage };
                }}
              />
            </TabsContent>
            <TabsContent value="signers" className="w-full">
              <SignerManager
                documentId={document.id}
                onSignerFieldsUpdateAction={async (signerId, color) => {
                  // Update all signature and initial fields with the signer ID
                  fields.forEach((field) => {
                    if (["signature", "initial"].includes(field.type)) {
                      updateField({
                        ...field,
                        signerId,
                        color,
                      });
                    }
                  });

                  console.log(
                    `Updated ${fields.filter((f) => ["signature", "initial"].includes(f.type)).length} signature fields with signer ID: ${signerId}`,
                  );
                  return { signerId, color };
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Main content area */}
        <div className="col-span-1 md:col-span-3 flex flex-col">
          <PDFEditViewerSimple
            pdfData={pdfData}
            fields={fields}
            currentPage={currentPage}
            onPageChangeAction={async (page) => {
              setCurrentPage(page);
              return page;
            }}
            onTotalPagesChangeAction={async (pages) => {
              setTotalPages(pages);
              return pages;
            }}
            onFieldUpdateAction={async (field) => {
              updateField(field);
              return field;
            }}
            onFieldDeleteAction={async (fieldId) => {
              deleteField(fieldId);
              return fieldId;
            }}
            selectedFieldId={selectedField?.id}
            onFieldSelectAction={async (field) => {
              selectField(field);
              return field;
            }}
            onFieldDragEnd={async (id, x, y) => {
              const field = fields.find((f) => f.id === id);
              if (field) {
                updateField({
                  ...field,
                  x,
                  y,
                });
              }
              return { id, x, y };
            }}
            onFieldResize={async (id, width, height) => {
              const field = fields.find((f) => f.id === id);
              if (field) {
                updateField({
                  ...field,
                  width,
                  height,
                });
              }
              return { id, width, height };
            }}
          />
          <PageNavigation
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChangeAction={async (page) => {
              setCurrentPage(page);
              return page;
            }}
          />
        </div>
      </div>
    </div>
  );
}
