"use client";

import { Document, User, DocumentField } from "@prisma/client";
import { getFromR2 } from "@/actions/r2";
import { PDFViewer } from "../common/pdf-viewer";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertTriangle,
  Check,
  Clock,
  Hash,
  FileSignature,
  Info,
  Shield,
  Edit,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { DocumentToolbar } from "../document/safe-document-toolbar";
import { toast } from "sonner";

interface SingleDocumentComponentProps {
  document: Document & {
    fields?: DocumentField[];
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
      <Card className="w-full max-w-7xl mx-auto my-8 border-border card-hover shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="size-4 text-primary" />
            </div>
            Loading Document...
          </CardTitle>
          <CardDescription>
            Please wait while the document is being loaded.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-96 space-y-4">
            <Progress value={30} className="w-full max-w-md" />
            <p className="text-muted-foreground">Retrieving document data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !pdfData) {
    return (
      <Card className="w-full max-w-7xl mx-auto my-8 border-border card-hover shadow-lg">
        <CardHeader className="border-b border-border bg-destructive/5">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-4 text-destructive" />
            </div>
            Error Loading Document
          </CardTitle>
          <CardDescription>
            There was an issue retrieving the document.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-96 text-destructive space-y-4">
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md max-w-md w-full">
              <p className="flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-1" /> {error}
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Loading
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  const handleDocumentSave = async (doc: Document | any) => {
    setIsSaving(true);
    try {
      // Implement save functionality here
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulating API call
      // In a real implementation, you'd call an API endpoint
      toast.success("Document sent for signing successfully!");

      // Return the document to satisfy the Promise<Document> return type requirement
      return doc;
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to send document for signing.");
      // Return the original document in case of error
      return doc;
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
        onSaveAction={(doc) => handleDocumentSave(doc as Document)}
      />
      <Card className="w-full max-w-7xl mx-auto my-8 border-border card-hover shadow-lg">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="size-4 text-primary" />
                </div>
                {document.title}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {document.description ||
                  "Review the document or check its details below."}
              </CardDescription>
            </div>
            <Badge
              variant={getStatusBadgeVariant(document.status)}
              className="text-xs sm:text-sm px-2 py-1 h-auto"
            >
              {document.status === "COMPLETED" && (
                <Check className="size-3 mr-1" />
              )}
              {document.status === "PENDING" && (
                <Clock className="size-3 mr-1" />
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
                className="rounded-none border-r py-3"
              >
                <FileText className="size-4 mr-2" />
                Document
              </TabsTrigger>
              <TabsTrigger value="details" className="rounded-none py-3">
                <Info className="size-4 mr-2" />
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="document" className="p-0 border-t">
              {error && pdfData && (
                <div className="m-6 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="size-4" /> There was an issue
                    refreshing the document: {error}. Displaying cached or
                    previous version.
                  </p>
                </div>
              )}

              {!pdfData && !error && (
                <div className="flex flex-col items-center justify-center h-96 border-b m-6 rounded-md bg-muted/20">
                  <FileText className="size-12 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">
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
                <div className="p-6 space-y-8">
                  {/* Document Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Shield className="size-5 text-primary" />
                      Document Information
                    </h3>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm rounded-lg bg-muted/20 p-4">
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Hash className="size-3.5" /> Document ID:
                        </p>
                        <p className="text-muted-foreground break-all bg-background/50 p-1.5 rounded border text-xs font-mono">
                          {document.id}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <FileText className="size-3.5" /> File Name:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">
                          {document.fileName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <FileSignature className="size-3.5" /> Title:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">
                          {document.title}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Shield className="size-3.5" /> Document Type:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">
                          {document.documentType}
                        </p>
                      </div>
                      {document.description && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <Info className="size-3.5" /> Description:
                          </p>
                          <p className="text-muted-foreground whitespace-pre-wrap bg-background/50 p-1.5 rounded border">
                            {document.description}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Shield className="size-3.5" /> Status:
                        </p>
                        <Badge
                          variant={getStatusBadgeVariant(document.status)}
                          className="mt-1"
                        >
                          {document.status}
                        </Badge>
                      </div>
                      
                      {/* Time Information */}
                      <div className="sm:col-span-2">
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Clock className="size-3.5" /> Timestamps:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background/50 p-1.5 rounded border">
                          <div>
                            <span className="text-xs font-medium">Created:</span>
                            <div className="text-muted-foreground text-xs">
                              {document.createdAt ? new Date(document.createdAt).toLocaleString() : "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-medium">Updated:</span>
                            <div className="text-muted-foreground text-xs">
                              {document.updatedAt ? new Date(document.updatedAt).toLocaleString() : "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-medium">Prepared:</span>
                            <div className="text-muted-foreground text-xs">
                              {document.preparedAt ? new Date(document.preparedAt).toLocaleString() : "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-medium">Signed:</span>
                            <div className="text-muted-foreground text-xs">
                              {document.signedAt ? new Date(document.signedAt).toLocaleString() : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Signer Information */}
                      {document.signers && document.signers.length > 0 && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <FileSignature className="size-3.5" /> Signer Details:
                          </p>
                          <div className="bg-background/50 p-1.5 rounded border">
                            <p>
                              <span className="text-xs font-medium">Name:</span>{" "}
                              <span className="text-muted-foreground">
                                {document.signers[0].name || "Not provided"}
                              </span>
                            </p>
                            <p>
                              <span className="text-xs font-medium">Email:</span>{" "}
                              <span className="text-muted-foreground">
                                {document.signers[0].email}
                              </span>
                            </p>
                            <p>
                              <span className="text-xs font-medium">ID:</span>{" "}
                              <span className="text-muted-foreground text-xs font-mono">
                                {document.signers[0].id}
                              </span>
                            </p>
                            {document.signers[0].role && (
                              <p>
                                <span className="text-xs font-medium">Role:</span>{" "}
                                <span className="text-muted-foreground">
                                  {document.signers[0].role}
                                </span>
                              </p>
                            )}
                            <p>
                              <span className="text-xs font-medium">Status:</span>{" "}
                              <Badge variant={getStatusBadgeVariant(document.signers[0].status)} className="ml-1 text-xs">
                                {document.signers[0].status}
                              </Badge>
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Edit className="size-3.5" /> Created By:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">
                          {author.name || author.email}
                        </p>
                      </div>
                      {document.hash && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <Hash className="size-3.5" /> File Hash (SHA256):
                          </p>
                          <p className="text-muted-foreground break-all text-xs font-mono bg-background/50 p-1.5 rounded border">
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
        <CardFooter className="border-t p-4 flex justify-end gap-3">
          {document.documentType === "UNSIGNED" && (
            <Button size="sm">
              <Link
                href={`/admin/documents/${document.id}/edit`}
                className="flex items-center"
              >
                <Edit className="size-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
