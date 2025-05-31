"use client";

import {
  Document as PrismaDocument,
  User,
  DocumentField as PrismaDocumentField,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { getFromR2 } from "@/actions/r2";
import { PDFViewer } from "../common/pdf-viewer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  AlertTriangle,
  Clock,
  Check,
  Info,
  ArrowLeft,
  Edit,
  Hash,
  UserIcon,
  Calendar,
  FileSignature,
  Shield,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { DocumentToolbar } from "../document/safe-document-toolbar";
import { toast } from "sonner";
import { Document } from "@/types/document";

interface SingleDocumentComponentProps {
  document: PrismaDocument & {
    fields?: PrismaDocumentField[];
    signers?: Array<{
      id: string;
      email: string;
      name?: string | null;
      status: string;
      role?: string | null;
      // Note: order field removed as it's not needed for single signer
    }>;
  };
  author: User;
}

export function SingleDocumentComponent({
  document,
  author,
}: SingleDocumentComponentProps) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      if (!document.key) {
        setError("Document key is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getFromR2({ Key: document.key });

        if (response.success) {
          if (response.data && response.data.Body) {
            setPdfData(response.data.Body);
            setError(null);
          } else {
            console.error(
              "Failed to fetch PDF: Response successful but no body content.",
            );
            setError("PDF content is missing in the response.");
          }
        } else {
          console.error(
            "Failed to fetch PDF:",
            response.message,
            response.error,
          );
          setError(response.message || "Failed to load PDF document.");
        }
      } catch (e) {
        console.error("Error fetching document:", e);
        setError(
          e instanceof Error ? e.message : "An unexpected error occurred.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [document.key]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return "success";
      case "REJECTED":
      case "DECLINED":
        return "destructive";
      case "PENDING":
        return "default";
      case "CANCELED":
        return "outline";
      case "EXPIRED":
        return "secondary"; // Changed from "warning" to "secondary" as "warning" is not a valid variant
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-7xl mx-auto my-2 xs:my-3 sm:my-4 md:my-6 lg:my-8 border-border shadow-lg">
        <CardHeader className="border-b border-border p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
          <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-semibold flex items-center gap-1 xs:gap-1.5 sm:gap-2">
            <div className="size-4 xs:size-5 sm:size-6 md:size-7 lg:size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="size-2 xs:size-2.5 sm:size-3 md:size-3.5 lg:size-4 text-primary" />
            </div>
            <span className="truncate">Loading Document...</span>
          </CardTitle>
          <CardDescription className="text-xs xs:text-sm sm:text-base">
            Please wait while the document is being loaded.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="flex flex-col justify-center items-center h-48 xs:h-56 sm:h-64 md:h-80 lg:h-96 space-y-2 xs:space-y-3 sm:space-y-4">
            <Progress
              value={30}
              className="w-full max-w-xs sm:max-w-sm md:max-w-md"
            />
            <p className="text-xs xs:text-sm sm:text-base text-muted-foreground text-center">
              Retrieving document data...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !pdfData) {
    return (
      <Card className="w-full max-w-7xl mx-auto my-2 xs:my-3 sm:my-4 md:my-6 lg:my-8 border-border card-hover shadow-lg">
        <CardHeader className="border-b border-border bg-destructive/5 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
          <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-semibold flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
            <div className="size-4 xs:size-5 sm:size-6 md:size-7 lg:size-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-2 xs:size-2.5 sm:size-3 md:size-3.5 lg:size-4 text-destructive" />
            </div>
            <span className="truncate">Error Loading Document</span>
          </CardTitle>
          <CardDescription className="text-xs xs:text-sm sm:text-base">
            There was an issue retrieving the document.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="flex flex-col justify-center items-center h-48 xs:h-56 sm:h-64 md:h-80 lg:h-96 text-destructive space-y-2 xs:space-y-3 sm:space-y-4">
            <div className="p-2 xs:p-3 sm:p-4 border border-destructive/50 bg-destructive/10 rounded-md max-w-xs sm:max-w-sm md:max-w-md w-full">
              <p className="flex items-start gap-1 xs:gap-1.5 sm:gap-2 text-xs xs:text-sm sm:text-base">
                <AlertTriangle className="size-3 xs:size-3.5 sm:size-4 shrink-0 mt-0.5" />
                <span className="break-words">{error}</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-7 xs:h-8 sm:h-9 md:h-10 text-xs xs:text-sm sm:text-base px-2 xs:px-3 sm:px-4 md:px-6"
            >
              Retry Loading
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  const handleDocumentSave = async (inputDoc: Document) => {
    setIsSaving(true);
    try {
      // Implement save functionality here
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulating API call
      // In a real implementation, you'd call an API endpoint
      toast.success("Document sent for signing successfully!");

      // Return the document with proper typing
      const savedDoc = {
        ...inputDoc,
        description: inputDoc.description ?? undefined,
        key: inputDoc.key || "",
        type: inputDoc.type || "default",
        updatedAt: new Date(),
      };

      return savedDoc;
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to send document for signing.");
      // Return the original document in case of error
      return inputDoc;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <DocumentToolbar
        document={{
          ...document,
          type: document.type || "default",
          // Convert null values to undefined where needed
          key: document.key || undefined,
          // Add any required properties for PartialDocument
          authorId: document.authorId || author.id,
          authorName: author.name || undefined,
          authorEmail: author.email || undefined,
          // Add the signer separately as it's not part of PartialDocument interface
          signer:
            document.signers && document.signers.length > 0
              ? document.signers[0]
              : undefined,
        }}
        isSaving={isSaving}
        onSaveAction={async (doc) => {
          // Ensure proper type conversion
          const safeDoc = {
            ...doc,
            description: doc.description ?? undefined,
          };
          const result = await handleDocumentSave(safeDoc as Document);
          // Use the appropriate return type
          return result as Document;
        }}
      />
      <Card className="w-full max-w-7xl mx-auto my-2 xs:my-3 sm:my-4 md:my-6 lg:my-8 border-border card-hover shadow-lg">
        <CardHeader className="border-b border-border p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="flex flex-col space-y-2 xs:space-y-3 sm:space-y-0 sm:flex-row sm:gap-2 md:gap-3 lg:gap-4 sm:items-center justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-semibold flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
                <div className="size-4 xs:size-5 sm:size-6 md:size-7 lg:size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="size-2 xs:size-2.5 sm:size-3 md:size-3.5 lg:size-4 text-primary" />
                </div>
                <span className="truncate">{document.title}</span>
              </CardTitle>
              <CardDescription className="text-xs xs:text-sm sm:text-base line-clamp-2 sm:line-clamp-1">
                {document.description ||
                  "Review the document or check its details below."}
              </CardDescription>
            </div>
            <Badge
              variant={getStatusBadgeVariant(document.status)}
              className="text-xs xs:text-sm sm:text-base px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 h-auto self-start sm:self-auto mt-1 sm:mt-0 shrink-0"
            >
              {document.status === "COMPLETED" && (
                <Check className="size-2.5 xs:size-3 sm:size-3.5 mr-1" />
              )}
              {document.status === "PENDING" && (
                <Clock className="size-2.5 xs:size-3 sm:size-3.5 mr-1" />
              )}
              {document.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="document" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-0 bg-muted/50">
              <TabsTrigger
                value="document"
                className="rounded-none border-r py-1.5 xs:py-2 sm:py-3 md:py-4 text-xs xs:text-sm sm:text-base data-[state=active]:bg-background"
              >
                <FileText className="size-2.5 xs:size-3 sm:size-4 md:size-5 mr-1 xs:mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Document</span>
                <span className="xs:hidden">Doc</span>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-none py-1.5 xs:py-2 sm:py-3 md:py-4 text-xs xs:text-sm sm:text-base data-[state=active]:bg-background"
              >
                <Info className="size-2.5 xs:size-3 sm:size-4 md:size-5 mr-1 xs:mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Details</span>
                <span className="xs:hidden">Info</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="document" className="p-0 border-t">
              {error && pdfData && (
                <div className="m-2 xs:m-3 sm:m-4 md:m-6 p-2 xs:p-3 sm:p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                  <p className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-xs xs:text-sm sm:text-base">
                    <AlertTriangle className="size-3 xs:size-3.5 sm:size-4 shrink-0" />
                    <span className="break-words">
                      There was an issue refreshing the document: {error}.
                      Displaying cached or previous version.
                    </span>
                  </p>
                </div>
              )}

              {!pdfData && !error && (
                <div className="flex flex-col items-center justify-center h-48 xs:h-56 sm:h-64 md:h-80 lg:h-96 border-b m-2 xs:m-3 sm:m-4 md:m-6 rounded-md bg-muted/20">
                  <FileText className="size-6 xs:size-8 sm:size-10 md:size-12 lg:size-16 text-muted-foreground/50 mb-1 xs:mb-2 sm:mb-3" />
                  <p className="text-xs xs:text-sm sm:text-base text-muted-foreground text-center px-2">
                    No document preview available.
                  </p>
                </div>
              )}

              {pdfData && (
                <div className="w-full border-b overflow-hidden p-0">
                  <div className="aspect-[1/1] w-full mx-auto">
                    <PDFViewer pdfData={pdfData} />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="pt-0 border-t">
              <ScrollArea className="h-full">
                <div className="p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8">
                  {/* Document Information */}
                  <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                    <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-medium flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <Shield className="size-3 xs:size-4 sm:size-5 md:size-6 text-primary" />
                      <span>Document Information</span>
                    </h3>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 xs:gap-x-4 sm:gap-x-6 gap-y-2 xs:gap-y-3 sm:gap-y-4 text-xs xs:text-sm sm:text-base rounded-lg bg-muted/20 p-2 xs:p-3 sm:p-4">
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Hash className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Document ID:
                        </p>
                        <p className="text-muted-foreground break-all bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs font-mono leading-tight">
                          {document.id}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <FileText className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          File Name:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                          {document.fileName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <FileSignature className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Title:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                          {document.title}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Shield className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Document Type:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs">
                          {document.documentType}
                        </p>
                      </div>
                      {document.description && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                            <Info className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                            Description:
                          </p>
                          <p className="text-muted-foreground whitespace-pre-wrap bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs leading-relaxed">
                            {document.description}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Shield className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Status:
                        </p>
                        <Badge
                          variant={getStatusBadgeVariant(document.status)}
                          className="mt-1 text-xs xs:text-sm"
                        >
                          {document.status}
                        </Badge>
                      </div>

                      {/* Time Information */}
                      <div className="sm:col-span-2">
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Clock className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Timestamps:
                        </p>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-1 xs:gap-2 bg-background/50 p-1 xs:p-1.5 rounded border">
                          <div>
                            <span className="text-[9px] xs:text-xs font-medium block">
                              Created:
                            </span>
                            <div className="text-muted-foreground text-[8px] xs:text-[9px] sm:text-xs break-words">
                              {document.createdAt
                                ? new Date(document.createdAt).toLocaleString()
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] xs:text-xs font-medium block">
                              Updated:
                            </span>
                            <div className="text-muted-foreground text-[8px] xs:text-[9px] sm:text-xs break-words">
                              {document.updatedAt
                                ? new Date(document.updatedAt).toLocaleString()
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] xs:text-xs font-medium block">
                              Prepared:
                            </span>
                            <div className="text-muted-foreground text-[8px] xs:text-[9px] sm:text-xs break-words">
                              {document.preparedAt
                                ? new Date(document.preparedAt).toLocaleString()
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] xs:text-xs font-medium block">
                              Signed:
                            </span>
                            <div className="text-muted-foreground text-[8px] xs:text-[9px] sm:text-xs break-words">
                              {document.signedAt
                                ? new Date(document.signedAt).toLocaleString()
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Signer Information */}
                      {document.signers && document.signers.length > 0 && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                            <FileSignature className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                            Signer Details:
                          </p>
                          <div className="bg-background/50 p-1 xs:p-1.5 rounded border space-y-1">
                            <p className="flex flex-col xs:flex-row xs:items-center gap-1">
                              <span className="text-[9px] xs:text-xs font-medium">
                                Name:
                              </span>{" "}
                              <span className="text-muted-foreground text-[9px] xs:text-xs break-words">
                                {document.signers[0].name || "Not provided"}
                              </span>
                            </p>
                            <p className="flex flex-col xs:flex-row xs:items-center gap-1">
                              <span className="text-[9px] xs:text-xs font-medium">
                                Email:
                              </span>{" "}
                              <span className="text-muted-foreground text-[9px] xs:text-xs break-all">
                                {document.signers[0].email}
                              </span>
                            </p>
                            <p className="flex flex-col xs:flex-row xs:items-center gap-1">
                              <span className="text-[9px] xs:text-xs font-medium">
                                ID:
                              </span>{" "}
                              <span className="text-muted-foreground text-[8px] xs:text-[9px] font-mono break-all">
                                {document.signers[0].id}
                              </span>
                            </p>
                            {document.signers[0].role && (
                              <p className="flex flex-col xs:flex-row xs:items-center gap-1">
                                <span className="text-[9px] xs:text-xs font-medium">
                                  Role:
                                </span>{" "}
                                <span className="text-muted-foreground text-[9px] xs:text-xs">
                                  {document.signers[0].role}
                                </span>
                              </p>
                            )}
                            <p className="flex flex-col xs:flex-row xs:items-center gap-1">
                              <span className="text-[9px] xs:text-xs font-medium">
                                Status:
                              </span>{" "}
                              <Badge
                                variant={getStatusBadgeVariant(
                                  document.signers[0].status,
                                )}
                                className="text-[8px] xs:text-[9px] px-1 py-0.5 h-auto self-start xs:self-auto"
                              >
                                {document.signers[0].status}
                              </Badge>
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Edit className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Created By:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                          {author.name || author.email}
                        </p>
                      </div>
                      {document.hash && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                            <Hash className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                            File Hash (SHA256):
                          </p>
                          <p className="text-muted-foreground break-all text-[8px] xs:text-[9px] sm:text-xs font-mono bg-background/50 p-1 xs:p-1.5 rounded border leading-tight">
                            {document.hash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t p-1.5 xs:p-2 sm:p-3 md:p-4 flex justify-end gap-1 xs:gap-2 sm:gap-3">
          {document.documentType === "UNSIGNED" && (
            <Button
              size="sm"
              className="h-6 xs:h-7 sm:h-8 md:h-9 text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4"
            >
              <Link
                href={`/admin/documents/${document.id}/edit`}
                className="flex items-center"
              >
                <Edit className="size-2.5 xs:size-3 sm:size-4 mr-1 xs:mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Edit</span>
                <span className="xs:hidden">E</span>
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
