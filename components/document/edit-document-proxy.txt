"use client";

import { useState, useEffect } from "react";
import { EditDocument } from "@/components/document/edit-document";
import { Document, DocumentField } from "@/types/document";
import { Skeleton } from "@/components/ui/skeleton";
import { getFromR2 } from "@/actions/r2";
import { getDocumentFields } from "@/actions/document";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { convertToDocumentFields } from "@/utils/document-field-converter";
import { DocumentStatus } from "@prisma/client";

interface EditDocumentComponentProps {
  document: Document;
}

export function EditDocumentComponent({
  document,
}: EditDocumentComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [fields, setFields] = useState<DocumentField[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch PDF from storage
        if (!document.key) {
          throw new Error("Document key is missing");
        }
        const response = await getFromR2({ Key: document.key });
        if (!response.success || !response.data?.Body) {
          throw new Error("Failed to fetch document from storage");
        }
        setPdfData(response.data.Body);

        // Fetch existing fields
        const fieldsResponse = await getDocumentFields(document.id);
        if (fieldsResponse.success) {
          setFields(convertToDocumentFields(fieldsResponse.fields || []));
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading document data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred loading the document",
        );
        setIsLoading(false);
      }
    }

    fetchData();
  }, [document.id, document.key]);

  if (isLoading) {
    return (
      <div className="container py-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !pdfData) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load document. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  } // Convert database document to the proper Document type with signers
  const documentWithSigners: Document = {
    id: document.id,
    title: document.title,
    description: document.description || undefined,
    authorId: document.authorId,
    status: document.status as DocumentStatus,
    key: document.key || "",
    type: document.type || "",
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    signedAt: document.signedAt || undefined,
    preparedAt: document.preparedAt || undefined,
    sentAt: document.sentAt || undefined,
    expiresAt: document.expiresAt || undefined,
    enableWatermark: document.enableWatermark || false,
    watermarkText: document.watermarkText || undefined,
    signers: [], // Initialize empty array for signers
  };

  return (
    <EditDocument
      document={documentWithSigners}
      pdfData={pdfData}
      initialFields={fields}
    />
  );
}
