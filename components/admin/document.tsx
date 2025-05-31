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
  Trash2,
  AlertCircle,
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
import { deleteDocument } from "@/actions/document";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DocumentComponent({
  documents,
  users,
}: {
  documents: (Document & { signers?: Signer[] })[];
  users: User[];
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null,
  );
  const router = useRouter();

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const openDeleteModal = (doc: Document) => {
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDocumentToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDeleteDocument = async () => {
    if (documentToDelete) {
      try {
        await deleteDocument(documentToDelete.id);
        toast.success("Document deleted successfully");
        router.refresh();
      } catch (error) {
        toast.error("Failed to delete document");
        console.error("Error deleting document:", error);
      } finally {
        closeDeleteModal();
      }
    }
  };

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
    <div className="container py-4 sm:py-8 px-2 sm:px-4 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:gap-8">
        {/* Header Section */}
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold tracking-tighter">
            Document Management
          </h1>
          <p className="text-xs xs:text-sm text-muted-foreground">
            Manage all organization documents and signature requests.
          </p>
        </div>

        {/* Document Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="card-hover border-border">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <FileSignature className="size-4 sm:size-5 text-primary" />
                All Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-xl sm:text-3xl font-bold">
                {allDocuments}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total documents in the system
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <Clock className="size-4 sm:size-5 text-amber-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-xl sm:text-3xl font-bold">
                {pendingDocuments}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Documents awaiting signature
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="size-4 sm:size-5 text-emerald-500" />
                Signed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-xl sm:text-3xl font-bold">
                {signedDocuments}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Completed documents
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 transition-all duration-300">
                <Upload className="size-6 sm:size-8 text-primary mb-1.5 sm:mb-2" />
                <p className="font-medium mb-2 sm:mb-3 text-center text-sm sm:text-base">
                  Upload New Document
                </p>
                <Button
                  className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-8 sm:h-10 text-xs sm:text-sm"
                  size="sm"
                  onClick={openUploadModal}
                >
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <Upload className="size-3.5 sm:size-4" />
                    Upload
                  </span>
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
                <p className="text-[10px] xs:text-xs text-muted-foreground mt-2 sm:mt-3">
                  Supported formats: PDF (max 10MB)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Table */}
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
              <FileSignature className="size-4 sm:size-5 text-primary" /> All
              Documents
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage document files and signature requests
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-2 sm:pt-3">
            {/* Search input */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by title, author, signee, status or type..."
                  className="pl-8 sm:pl-9 h-8 sm:h-10 text-xs sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-8 sm:size-10 shrink-0"
                onClick={openUploadModal}
              >
                <Upload className="size-3.5 sm:size-4" />
                <span className="sr-only">Upload document</span>
              </Button>
            </div>

            {filteredDocuments.length > 0 ? (
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Title
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Author
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Signers
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Status
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Type
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3 hidden md:table-cell">
                        Signed At
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3 hidden sm:table-cell">
                        Updated At
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3 text-right">
                        Actions
                      </TableHead>
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
                          <TableCell className="font-medium max-w-[120px] sm:max-w-[150px] truncate text-xs sm:text-sm py-2 sm:py-3">
                            {doc.title}
                          </TableCell>
                          <TableCell className="py-2 sm:py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs sm:text-sm">
                                {author?.name || "Unknown"}
                              </span>
                              <span className="text-[10px] xs:text-xs text-muted-foreground">
                                {author?.email || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 sm:py-3">
                            {primarySigner ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-xs sm:text-sm">
                                  {primarySigner.name || "—"}
                                </span>
                                <span className="text-[10px] xs:text-xs text-muted-foreground">
                                  {primarySigner.email}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-[10px] xs:text-xs text-muted-foreground">
                                  Not assigned
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2 sm:py-3">
                            {getStatusBadge(doc.status)}
                          </TableCell>
                          <TableCell className="py-2 sm:py-3">
                            {getTypeBadge(doc.documentType)}
                          </TableCell>
                          <TableCell className="py-2 sm:py-3 hidden md:table-cell">
                            {doc.signedAt ? (
                              <div className="flex flex-col">
                                <span className="text-xs sm:text-sm">
                                  {doc.signedAt.toDateString()}
                                </span>
                                <span className="text-[10px] xs:text-xs text-muted-foreground">
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
                              <div className="flex flex-col">
                                <span className="text-[10px] xs:text-xs text-muted-foreground">
                                  Not signed yet
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2 sm:py-3 hidden sm:table-cell">
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm">
                                {doc.updatedAt.toDateString()}
                              </span>
                              <span className="text-[10px] xs:text-xs text-muted-foreground">
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
                          <TableCell className="text-right py-2 sm:py-3">
                            <div className="flex justify-end items-center gap-0.5 sm:gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 sm:size-8"
                                asChild
                              >
                                <Link href={`/admin/documents/${doc.id}`}>
                                  <Eye className="size-3.5 sm:size-4" />
                                  <span className="sr-only">View document</span>
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 sm:size-8"
                                  >
                                    <MoreHorizontal className="size-3.5 sm:size-4" />
                                    <span className="sr-only">
                                      More options
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="text-xs sm:text-sm"
                                >
                                  <DropdownMenuLabel className="text-xs sm:text-sm">
                                    Actions
                                  </DropdownMenuLabel>
                                  {doc.status !== DocumentStatus.PENDING && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/admin/documents/${doc.id}/edit`,
                                        )
                                      }
                                    >
                                      Edit document
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/admin/documents/${doc.id}/preview`,
                                      )
                                    }
                                  >
                                    Preview document
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => openDeleteModal(doc)}
                                  >
                                    <Trash2 className="mr-2 size-3.5 sm:size-4" />
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
              <div className="flex items-center justify-center p-6 sm:p-8 text-xs sm:text-sm text-muted-foreground border rounded-md">
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
        onUploadSuccess={() => {
          router.refresh();
          toast.success("Document uploaded successfully");
        }}
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="max-w-[90vw] w-full sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <AlertCircle className="size-5 sm:size-6 text-red-500" />
                Confirm Deletion
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 flex-col xs:flex-row">
            <AlertDialogCancel
              onClick={closeDeleteModal}
              className="h-8 sm:h-9 text-xs sm:text-sm mt-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-red-500 text-white hover:bg-red-600 h-8 sm:h-9 text-xs sm:text-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
