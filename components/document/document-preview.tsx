"use client";

import { useState, useEffect } from "react";
import { PDFViewer } from "@/components/common/pdf-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { getFromR2 } from "@/actions/r2";
import { Document, DocumentField } from "@/types/document";
import { sendDocumentForSigning } from "@/actions/document";
import { toast } from "sonner";
import { PDFViewerSimple } from "@/components/document/pdf-viewer-simple";

interface DocumentPreviewProps {
  document: Document;
  fields: DocumentField[];
}

export function DocumentPreview({ document, fields }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

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
  const handleBack = () => {
    // Check if we're in admin path
    const isAdmin = window.location.pathname.includes("/admin/");
    if (isAdmin) {
      router.push(`/admin/documents/${document.id}`);
    } else {
      router.push(`/documents/${document.id}`);
    }
  };

  const handleSendForSigning = async () => {
    if (!document.id) {
      toast.error("Document ID is missing");
      return;
    }

    try {
      setIsSending(true);
      const result = await sendDocumentForSigning(document.id);

      if (result.success) {
        toast.success("Document sent for signing");
        router.push("/documents");
      } else {
        toast.error(result.message || "Failed to send document");
      }
    } catch (error) {
      console.error("Error sending document:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };
  const handleDownload = async () => {
    try {
      // Generate download URL from R2 key
      if (document.key) {
        const result = await getFromR2({
          Key: document.key,
          ResponseContentDisposition: `attachment; filename="${document.title || "document"}.pdf"`,
        });
        if (result.success && result.data) {
          // Get the URL from data or create a temporary URL if needed
          const url =
            (typeof result.data === "string" ? result.data : null) ||
            (result.data.Body instanceof Blob
              ? URL.createObjectURL(result.data.Body)
              : null);
          if (url) {
            window.open(url, "_blank");
          } else {
            toast.error("Unable to generate document URL");
          }
        } else {
          toast.error("Failed to generate document download link");
        }
      } else {
        toast.error("Document key is not available");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
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
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!document.key}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleSendForSigning} disabled={isSending}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Send for Signing"}
          </Button>
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
