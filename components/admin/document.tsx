"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSignature, CheckCircle, Clock } from "lucide-react";
import { FileUploadModal } from "./file-upload-modal";
import { Document, DocumentStatus, DocumentType } from "@prisma/client";

export function DocumentComponent({ documents }: { documents: Document[] }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const allDocuments = documents.length;
  const pendingDocuments = documents.filter((doc) => doc.status === DocumentStatus.PENDING).length;
  const signedDocuments = documents.filter((doc) => doc.documentType === DocumentType.SIGNED).length;

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
              <div className="text-3xl font-bold">{allDocuments}</div>
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
              <div className="text-3xl font-bold">{pendingDocuments}</div>
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
              <div className="text-3xl font-bold">{signedDocuments}</div>
              <p className="text-sm text-muted-foreground">Completed documents</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center h-full p-6 transition-all duration-300">
                <Upload className="h-8 w-8 text-primary mb-2" />
                <p className="font-medium mb-3 text-center">Upload New Document</p>
                <Button className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" size="lg" onClick={openUploadModal}>
                  <span className="relative z-10 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </span>
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
                <p className="text-xs text-muted-foreground mt-3">Supported formats: PDF (max 10MB)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Table */}
      </div>

      {/* Upload Modal */}
      <FileUploadModal isOpen={isUploadModalOpen} onCloseAction={closeUploadModal} />
    </div>
  );
}
