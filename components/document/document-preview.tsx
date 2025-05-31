"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSignature } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getFromR2 } from "@/actions/r2";
import { Document, DocumentField } from "@/types/document";
import { toast } from "sonner";
import { PDFViewerSimple } from "@/components/document/pdf-viewer-simple";

interface DocumentPreviewProps {
  document: Document;
  fields: DocumentField[];
}

export function DocumentPreview({ document, fields }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Fetch PDF data from R2
  useEffect(() => {
    const fetchPdf = async () => {
      if (!document?.key) {
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
  }, [document?.key]);
  const handleBack = () => {
    // Check if we're in admin path using the pathname hook
    const isAdmin = pathname?.includes("/admin/");
    if (isAdmin) {
      router.push(`/admin/documents/${document.id}`);
    } else {
      router.push(`/documents/${document.id}`);
    }
  };
  const isAdminRoute = pathname?.includes("/admin");
  const handleSignRedirect = async () => {
    if (!isAdminRoute) {
      router.push(`/documents/${document.id}/sign`);
    }
  };

  if (isLoading || !pdfData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between bg-background shadow-sm">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Document
          </Button>
          <h1 className="text-lg font-medium hidden md:block">
            {document.title || "Untitled Document"} - Preview
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {!isAdminRoute && document.status === "PENDING" && (
            <Button
              variant="outline"
              onClick={handleSignRedirect}
              disabled={!document.key}
            >
              <FileSignature className="h-4 w-4 mr-2" />
              Sign
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 flex-grow">
        <div className="bg-muted rounded-lg overflow-hidden h-full">
          <PDFViewerSimple
            pdfData={pdfData}
            fields={fields}
            highlightFields={true}
            debug={process.env.NODE_ENV === "development"}
          />
        </div>
      </div>
    </div>
  );
}
