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

  // Handle save
  const handleSave = async () => {
    try {
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
                  addField(fieldType, pageNumber ?? currentPage);
                  return { fieldType, pageNumber: pageNumber ?? currentPage };
                }}
              />
            </TabsContent>
            <TabsContent value="signers" className="w-full">
              <SignerManager
                documentId={document.id}
                onSignerFieldsUpdateAction={async (signerId, color) => {
                  if (selectedField) {
                    updateField({
                      ...selectedField,
                      color,
                    });
                  }
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
