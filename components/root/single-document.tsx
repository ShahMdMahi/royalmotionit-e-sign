"use client";

import {
  Document as PrismaDocument,
  User as PrismaUser,
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
import {
  FileText,
  AlertTriangle,
  ArrowLeft,
  Info,
  Clock,
  Check,
  Shield,
  Hash,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { DocumentToolbar } from "../document/document-toolbar";
import { toast } from "sonner";
import { Document as DocumentType } from "@/types/document";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";

interface SingleDocumentComponentProps {
  document: PrismaDocument & {
    fields?: PrismaDocumentField[];
    signers?: Array<{
      id: string;
      documentId: string;
      email: string;
      name?: string | undefined;
      status: string;
      role?: string | undefined;
      // Note: order field removed as it's not needed for single signer
    }>;
  };
  author?: PrismaUser;
  backLink?: string;
}

export function SingleDocumentComponent({
  document,
  author,
  backLink = "/documents",
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
        return "success";
      case "REJECTED":
        return "destructive";
      case "PENDING":
        return "default";
      default:
        return "secondary";
    }
  };

  // Handle document actions
  const handleDocumentSave = async (inputDoc: DocumentType) => {
    setIsSaving(true);
    try {
      // Here you would normally implement save functionality
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulating API call
      toast.success("Document processed successfully!");

      // Return a properly formatted Document type
      const savedDoc: DocumentType = {
        ...inputDoc,
        description: inputDoc.description ?? undefined,
        key: inputDoc.key || "",
        type: inputDoc.type || "default",
        updatedAt: new Date(),
      };

      return savedDoc;
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error("Failed to process document");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-7xl mx-auto my-2 xs:my-3 sm:my-4 md:my-6 lg:my-8 border-border shadow-lg">
        <CardHeader className="border-b border-border p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
          <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-semibold flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
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
      <Card className="w-full max-w-7xl mx-auto my-2 xs:my-3 sm:my-4 md:my-6 lg:my-8 border-border shadow-lg">
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
        <CardFooter className="border-t p-1.5 xs:p-2 sm:p-3 md:p-4 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-6 xs:h-7 sm:h-8 md:h-9 text-xs xs:text-sm sm:text-base"
          >
            <Link href={backLink}>
              <ArrowLeft className="size-2.5 xs:size-3 sm:size-4 mr-1 xs:mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Back</span>
              <span className="xs:hidden">←</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  return (
    <div className="flex flex-col w-full">
      <DocumentToolbar
        document={
          {
            ...document,
            type: "default",
            key: document.key || "", // Ensure key is never null
            description: document.description || "", // Convert null to string
            preparedAt: document.preparedAt || undefined, // Convert null to undefined
            sentAt: document.sentAt || undefined, // Convert null to undefined
            signedAt: document.signedAt || undefined, // Convert null to undefined
            expiresAt: document.expiresAt || undefined, // Convert null to undefined
            watermarkText: document.watermarkText || undefined, // Convert null to undefined
            signer:
              document.signers && document.signers.length > 0
                ? {
                    id: document.signers[0].id,
                    documentId: document.signers[0].documentId || document.id,
                    email: document.signers[0].email,
                    name: document.signers[0].name || undefined,
                    role: document.signers[0].role || undefined,
                    status: document.signers[0].status as
                      | "PENDING"
                      | "COMPLETED"
                      | "DECLINED"
                      | "VIEWED",
                  }
                : undefined,
            fields: document.fields?.map((f) => ({
              ...f,
              type: f.type as import("@/types/document").DocumentFieldType, // Cast to correct type
              placeholder: f.placeholder ?? undefined,
              value: f.value ?? undefined,
              color: f.color ?? undefined,
              fontFamily: f.fontFamily ?? undefined,
              validationRule: f.validationRule ?? undefined,
              conditionalLogic: f.conditionalLogic ?? undefined,
              options: f.options ?? undefined,
              backgroundColor: f.backgroundColor ?? undefined,
              borderColor: f.borderColor ?? undefined,
              textColor: f.textColor ?? undefined,
              fontSize: f.fontSize ?? undefined, // Convert null to undefined
            })),
          } as DocumentType
        }
        isSaving={isSaving}
        onSaveAction={async (inputDoc) => {
          // Ensure description is never null
          const safeDoc = {
            ...inputDoc,
            description: inputDoc.description ?? undefined,
          };
          return handleDocumentSave(safeDoc as DocumentType);
        }}
      />

      <Card className="w-full max-w-7xl mx-auto my-2 xs:my-3 sm:my-4 md:my-6 lg:my-8 border-border shadow-lg">
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
                  "View the document and check its details below."}
              </CardDescription>
            </div>
            <Badge
              variant={getStatusBadgeVariant(document.status)}
              className="text-xs xs:text-sm sm:text-base px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 h-auto self-start sm:self-auto shrink-0"
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
                  <div className="aspect-[1/1.4] w-full mx-auto">
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
                          <FileText className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Title:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                          {document.title}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Shield className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Status:
                        </p>
                        <Badge
                          variant={getStatusBadgeVariant(document.status)}
                          className="mt-1 text-[9px] xs:text-xs sm:text-sm"
                        >
                          {document.status}
                        </Badge>
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
                          <UserIcon className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Author:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                          {author?.name || author?.email || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Calendar className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Created:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                          {formatDate(document.createdAt)}
                        </p>
                      </div>
                      {document.hash && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                            <Hash className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                            Document Hash:
                          </p>
                          <p className="text-muted-foreground break-all text-[8px] xs:text-[9px] sm:text-xs font-mono bg-background/50 p-1 xs:p-1.5 rounded border leading-tight">
                            {document.hash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Information */}
                  <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                    <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-medium flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <Clock className="size-3 xs:size-4 sm:size-5 md:size-6 text-primary" />
                      <span>Document Timeline</span>
                    </h3>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 xs:gap-x-4 sm:gap-x-6 gap-y-2 xs:gap-y-3 sm:gap-y-4 text-xs xs:text-sm sm:text-base rounded-lg bg-muted/20 p-2 xs:p-3 sm:p-4">
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Calendar className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Created At:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                          {formatDate(document.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                          <Calendar className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                          Updated At:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                          {formatDate(document.updatedAt)}
                        </p>
                      </div>
                      {document.preparedAt && (
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                            <Calendar className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                            Prepared At:
                          </p>
                          <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                            {formatDate(document.preparedAt)}
                          </p>
                        </div>
                      )}
                      {document.sentAt && (
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                            <Calendar className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                            Sent At:
                          </p>
                          <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                            {formatDate(document.sentAt)}
                          </p>
                        </div>
                      )}
                      {document.signedAt && (
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                            <Calendar className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                            Signed At:
                          </p>
                          <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                            {formatDate(document.signedAt)}
                          </p>
                        </div>
                      )}
                      {document.expiresAt && (
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                            <Calendar className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                            Expires At:
                          </p>
                          <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                            {formatDate(document.expiresAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signer Information */}
                  {document.signers && document.signers.length > 0 && (
                    <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                      <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-medium flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                        <UserIcon className="size-3 xs:size-4 sm:size-5 md:size-6 text-primary" />
                        <span>Signer Information</span>
                      </h3>
                      <Separator />
                      <div className="rounded-lg bg-muted/20 p-2 xs:p-3 sm:p-4">
                        {document.signers.map((signer) => (
                          <div
                            key={signer.id}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 xs:gap-x-4 sm:gap-x-6 gap-y-2 xs:gap-y-3 sm:gap-y-4 text-xs xs:text-sm sm:text-base"
                          >
                            <div>
                              <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                                <UserIcon className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                                Name:
                              </p>
                              <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                                {signer.name || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                                <Info className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                                Email:
                              </p>
                              <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-all">
                                {signer.email}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                                <Info className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                                Status:
                              </p>
                              <Badge
                                variant={getStatusBadgeVariant(signer.status)}
                                className="mt-1 text-[9px] xs:text-xs sm:text-sm"
                              >
                                {signer.status}
                              </Badge>
                            </div>
                            {signer.role && (
                              <div>
                                <p className="font-semibold text-primary flex items-center gap-1 xs:gap-1.5 mb-1">
                                  <Info className="size-2.5 xs:size-3 sm:size-3.5" />{" "}
                                  Role:
                                </p>
                                <p className="text-muted-foreground bg-background/50 p-1 xs:p-1.5 rounded border text-[9px] xs:text-[10px] sm:text-xs break-words">
                                  {signer.role}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t p-1.5 xs:p-2 sm:p-3 md:p-4 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-6 xs:h-7 sm:h-8 md:h-9 text-xs xs:text-sm sm:text-base"
          >
            <Link href={backLink}>
              <ArrowLeft className="size-2.5 xs:size-3 sm:size-4 mr-1 xs:mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Back</span>
              <span className="xs:hidden">←</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
