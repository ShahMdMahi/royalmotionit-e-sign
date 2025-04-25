"use client";

import { Document, DocumentStatus, DocumentSet } from "@prisma/client";
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

export function DocumentComponent({ documents, documentSets }: { documents: Document[]; documentSets: DocumentSet[] }) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
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
      console.log("Sending to API:", documentData);

      // Call your API to save the document metadata in your database
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(documentData),
      });

      if (!response.ok) {
        throw new Error("Failed to save document");
      }

      toast.success("Document uploaded successfully");
      setIsUploadDialogOpen(false);

      // Refresh the page data instead of reloading
      router.refresh();

      return Promise.resolve();
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
      return Promise.resolve();
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
              <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary/5 to-primary/10 p-6 transition-all duration-300">
                <Upload className="h-8 w-8 text-primary mb-2" />
                <p className="font-medium mb-3 text-center">Upload New Document</p>
                <Button className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" size="lg" onClick={() => setIsUploadDialogOpen(true)}>
                  <span className="relative z-10 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </span>
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
                <p className="text-xs text-muted-foreground mt-3">Supported formats: PDF</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Table - Now using the DocumentTable component with enhanced data */}
        <DocumentTable documents={documentsWithSets} />
      </div>

      {/* Document Upload Component */}
      <DocumentUpload isOpen={isUploadDialogOpen} onCloseAction={handleCloseAction} onUploadCompleteAction={handleUploadCompleteAction} />
    </div>
  );
}
