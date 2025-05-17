"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Upload,
  FileSignature,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { FileUploadModal } from "./file-upload-modal";
import {
  Document,
  DocumentStatus,
  DocumentType,
  User,
  Signer,
} from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function DocumentComponent({
  documents,
  users,
}: {
  documents: (Document & { signers?: Signer[] })[];
  users: User[];
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  // Filter documents based on search criteria
  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;

    const searchLower = searchTerm.toLowerCase();
    return documents.filter((doc) => {
      // Find the author user
      const author = users.find((user) => user.id === doc.authorId);
      // Check if signer exists and matches search
      const primarySigner =
        doc.signers && doc.signers.length > 0 ? doc.signers[0] : null;
      const signerMatches = primarySigner
        ? primarySigner.email?.toLowerCase().includes(searchLower) ||
          primarySigner.name?.toLowerCase().includes(searchLower)
        : false;

      // Check if any search filters match
      return (
        doc.title.toLowerCase().includes(searchLower) ||
        author?.name?.toLowerCase().includes(searchLower) ||
        author?.email?.toLowerCase().includes(searchLower) ||
        signerMatches ||
        doc.status.toLowerCase().includes(searchLower) ||
        doc.documentType.toLowerCase().includes(searchLower)
      );
    });
  }, [documents, users, searchTerm]);

  const allDocuments = documents.length;
  const pendingDocuments = documents.filter(
    (doc) => doc.status === DocumentStatus.PENDING,
  ).length;
  const signedDocuments = documents.filter(
    (doc) => doc.documentType === DocumentType.SIGNED,
  ).length;

  // Helper function for status badge
  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Pending
          </Badge>
        );
      case DocumentStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Completed
          </Badge>
        );
      case DocumentStatus.DECLINED:
        return (
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-700 border-rose-200"
          >
            Declined
          </Badge>
        );
      case DocumentStatus.EXPIRED:
        return (
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 border-slate-200"
          >
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
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Signed
          </Badge>
        );
      case DocumentType.UNSIGNED:
        return (
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 border-slate-200"
          >
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
          <h1 className="text-3xl font-bold tracking-tighter">
            Document Management
          </h1>
          <p className="text-muted-foreground">
            Manage all organization documents and signature requests.
          </p>
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
              <p className="text-sm text-muted-foreground">
                Total documents in the system
              </p>
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
              <p className="text-sm text-muted-foreground">
                Documents awaiting signature
              </p>
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
              <p className="text-sm text-muted-foreground">
                Completed documents
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center h-full p-6 transition-all duration-300">
                <Upload className="h-8 w-8 text-primary mb-2" />
                <p className="font-medium mb-3 text-center">
                  Upload New Document
                </p>
                <Button
                  className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  size="lg"
                  onClick={openUploadModal}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </span>
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Supported formats: PDF (max 10MB)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Table - Updated to match users table styling */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSignature className="size-5 text-primary" /> All Documents
            </CardTitle>
            <CardDescription>
              Manage document files and signature requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search input - styled like users table */}
            <div className="mb-6 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by title, author, signee, status or type..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={openUploadModal}
              >
                <Upload className="h-4 w-4" />
                <span className="sr-only">Upload document</span>
              </Button>
            </div>

            {filteredDocuments.length > 0 ? (
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Signers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Signed At</TableHead>
                      <TableHead>Updated At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => {
                      const author = users.find(
                        (user) => user.id === doc.authorId,
                      );
                      // Get the signer for display (using first signer in the array if present)
                      const primarySigner =
                        doc.signers && doc.signers.length > 0
                          ? doc.signers[0]
                          : null;

                      return (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium max-w-[150px] truncate">
                            {doc.title}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {author?.name || "Unknown"}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {author?.email || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {primarySigner ? (
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {primarySigner.name || "—"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {primarySigner.email}
                                </span>
                              </div>
                            ) : (
                              <div className="text-sm flex flex-col">
                                <span className="text-muted-foreground">
                                  Not assigned
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell>
                            {getTypeBadge(doc.documentType)}
                          </TableCell>
                          <TableCell>
                            {doc.signedAt ? (
                              <div className="text-sm flex flex-col">
                                <span>{doc.signedAt.toDateString()}</span>
                                <span className="text-muted-foreground">
                                  {new Date(doc.signedAt).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      timeZone: "Asia/Dhaka",
                                      timeZoneName: "short",
                                    },
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className="text-sm flex flex-col">
                                <span className="text-muted-foreground">
                                  Not signed yet
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm flex flex-col">
                              <span>{doc.updatedAt.toDateString()}</span>
                              <span className="text-muted-foreground">
                                {new Date(doc.updatedAt).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: "Asia/Dhaka",
                                    timeZoneName: "short",
                                  },
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <Link href={`/admin/documents/${doc.id}`}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View document</span>
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">
                                      More options
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    Send reminder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Share document
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    Delete document
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground border rounded-md">
                {searchTerm
                  ? "No documents found matching your search"
                  : "No documents found. Upload a new document to get started."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onCloseAction={closeUploadModal}
      />
    </div>
  );
}
