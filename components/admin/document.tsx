"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSignature, CheckCircle, Clock, Download, Eye, Edit, MoreHorizontal } from "lucide-react";
import { FileUploadModal } from "./file-upload-modal";
import { Document, DocumentStatus, DocumentType } from "@prisma/client";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function DocumentComponent({ documents }: { documents: Document[] }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const allDocuments = documents.length;
  const pendingDocuments = documents.filter((doc) => doc.status === DocumentStatus.PENDING).length;
  const signedDocuments = documents.filter((doc) => doc.documentType === DocumentType.SIGNED).length;

  // Helper function for status badge
  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Pending
          </Badge>
        );
      case DocumentStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Approved
          </Badge>
        );
      case DocumentStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
            Rejected
          </Badge>
        );
      case DocumentStatus.EXPIRED:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function for document type badge
  const getTypeBadge = (type: DocumentType) => {
    switch (type) {
      case DocumentType.SIGNED:
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Signed
          </Badge>
        );
      case DocumentType.UNSIGNED:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
            Unsigned
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
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
        <div className="rounded-lg border bg-card">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Documents List</h2>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline">
                      Filter
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Filter documents by status or type</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline">
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export documents as CSV</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <Table>
            <TableCaption>A list of all documents in the system.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Signee</TableHead>
                <TableHead>Signed At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    No documents found. Upload a new document to get started.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{doc.title}</TableCell>
                    <TableCell>{doc.authorId}</TableCell>
                    <TableCell>{doc.signeeId || "—"}</TableCell>
                    <TableCell>{doc.signedAt ? formatDate(doc.signedAt) : "—"}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>{getTypeBadge(doc.documentType)}</TableCell>
                    <TableCell>{formatDate(doc.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View document</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View document</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit document</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit document</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download document</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download document</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Send reminder</DropdownMenuItem>
                            <DropdownMenuItem>Share document</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Delete document</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Upload Modal */}
      <FileUploadModal isOpen={isUploadModalOpen} onCloseAction={closeUploadModal} />
    </div>
  );
}
