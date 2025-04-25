"use client";

import { Document, DocumentStatus, DocumentSet, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Upload, FileSignature, CheckCircle, Clock } from "lucide-react";
import { DocumentUpload } from "@/components/admin/document-upload";
import { DocumentTable } from "@/components/admin/document-table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Define a type for document with its document set
type DocumentWithSet = Document & {
  documentSet?: DocumentSet | null;
};

export function DocumentComponent({ documents, documentSets, users }: { documents: Document[]; documentSets: DocumentSet[]; users: User[] }) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const pendingDocuments = documents.filter((doc) => doc.status === DocumentStatus.PENDING);
  const signedDocuments = documents.filter((doc) => doc.status === DocumentStatus.APPROVED);

  // Enrich documents with their document sets
  const documentsWithSets: DocumentWithSet[] = documents.map((doc) => {
    const documentSet = doc.documentSetId ? documentSets.find((set) => set.id === doc.documentSetId) : null;
    return {
      ...doc,
      documentSet,
    };
  });

  const handleCloseAction = async () => {
    if (isProcessing) {
      // Show warning if trying to close during processing
      toast.warning("Please wait until the current operation completes");
      return Promise.resolve();
    }

    setIsUploadDialogOpen(false);
    return Promise.resolve();
  };

  const handleUploadCompleteAction = async (
    blobUrl: string,
    title: string,
    description: string,
    blobDetails: {
      pathname: string;
      contentType: string;
      contentDisposition: string;
      url: string;
      downloadUrl: string;
    },
    documentSetId: string,
    documentId: string
  ) => {
    try {
      setIsProcessing(true);

      // Debug: Log what we're sending to the API
      const documentData = {
        documentId,
        title,
        description,
        pathname: blobDetails.pathname,
        contentType: blobDetails.contentType,
        contentDisposition: blobDetails.contentDisposition,
        url: blobDetails.url,
        downloadUrl: blobDetails.downloadUrl,
        documentSetId,
      };
      // console.log("Sending to API:", documentData);

      // Add timeout to handle cases where the API might hang
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // Call your API to save the document metadata in your database
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(documentData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to save document");
        }

        toast.success("Document uploaded and saved successfully");
        setIsUploadDialogOpen(false);

        // Refresh the page data instead of reloading
        router.refresh();
      } catch (err: unknown) {
        // Explicitly type error
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === "AbortError") {
          throw new Error("Request timed out. The server might be experiencing issues.");
        }
        throw err;
      }

      return Promise.resolve();
    } catch (err: unknown) {
      // Use proper error typing
      console.error("Error saving document:", err);

      // Provide more specific error messages based on the error
      if (err instanceof Error) {
        if (err.message.includes("timed out")) {
          toast.error("The request took too long to complete. Please try again later.");
        } else if (err.message.includes("Failed to save")) {
          toast.error(`Failed to save document: ${err.message}`);
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          toast.error("Network error. Please check your connection and try again.");
        } else {
          toast.error("An error occurred during document processing. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred during document processing.");
      }

      // Try to clean up the document entry if update failed
      try {
        if (documentId) {
          toast.info("Cleaning up incomplete document upload...");

          await fetch(`/api/documents/${documentId}`, {
            method: "DELETE",
          });
        }
      } catch (cleanupErr) {
        console.error("Failed to clean up after error:", cleanupErr);
      }

      // Return a resolved promise to ensure the component can continue
      return Promise.resolve();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tighter">Document Management</h1>
          <p className="text-muted-foreground">Manage all organization documents and signature requests.</p>
        </div>

        {/* Document Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                All Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{documents.length}</div>
              <p className="text-sm text-muted-foreground">Total documents in the system</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingDocuments.length}</div>
              <p className="text-sm text-muted-foreground">Documents awaiting signature</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Signed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{signedDocuments.length}</div>
              <p className="text-sm text-muted-foreground">Completed documents</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center h-full p-6 transition-all duration-300">
                <Upload className="h-8 w-8 text-primary mb-2" />
                <p className="font-medium mb-3 text-center">Upload New Document</p>
                <Button
                  className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  size="lg"
                  onClick={() => setIsUploadDialogOpen(true)}
                  disabled={isProcessing}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {isProcessing ? "Processing..." : "Upload"}
                  </span>
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
                <p className="text-xs text-muted-foreground mt-3">Supported formats: PDF (max 10MB)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Table - Now using the DocumentTable component with enhanced data */}
        <DocumentTable documents={documentsWithSets} users={users} />
      </div>

      {/* Document Upload Component */}
      <DocumentUpload isOpen={isUploadDialogOpen} onCloseAction={handleCloseAction} onUploadCompleteAction={handleUploadCompleteAction} />
    </div>
  );
}
