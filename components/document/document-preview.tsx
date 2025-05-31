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
      <div className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm sm:text-base text-muted-foreground animate-pulse">
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header - Responsive navigation and title */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left section - Back button and title */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex-shrink-0 h-8 sm:h-9 px-2 sm:px-3"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline text-xs sm:text-sm">
                  Back
                </span>
                <span className="hidden sm:inline ml-1">to Document</span>
              </Button>

              {/* Title with responsive behavior */}
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg lg:text-xl font-medium truncate">
                  <span className="hidden sm:inline">
                    {document.title || "Untitled Document"} - Preview
                  </span>
                  <span className="sm:hidden">
                    {(document.title || "Document").length > 15
                      ? `${(document.title || "Document").substring(0, 15)}...`
                      : document.title || "Document"}
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground sm:hidden">
                  Preview
                </p>
              </div>
            </div>

            {/* Right section - Action buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {!isAdminRoute && document.status === "PENDING" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignRedirect}
                  disabled={!document.key}
                  className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <FileSignature className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - PDF viewer with responsive padding */}
      <div className="flex-1 p-2 sm:p-4 lg:p-6 bg-slate-50/50">
        <div className="h-full max-w-full">
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden h-full">
            <PDFViewerSimple
              pdfData={pdfData}
              fields={fields}
              highlightFields={true}
              debug={process.env.NODE_ENV === "development"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
