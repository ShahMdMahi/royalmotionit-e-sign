"use client";

import { Document as PrismaDocument, User as PrismaUser, DocumentField as PrismaDocumentField } from "@prisma/client";
import { useEffect, useState } from "react";
import { getFromR2 } from "@/actions/r2";
import { PDFViewer } from "../common/pdf-viewer";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, AlertTriangle, ArrowLeft, Info, Clock, Check, Shield, Hash, User as UserIcon, Calendar } from "lucide-react";
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

export function SingleDocumentComponent({ document, author, backLink = "/documents" }: SingleDocumentComponentProps) {
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
            console.error("Failed to fetch PDF: Response successful but no body content.");
            setError("PDF content is missing in the response.");
          }
        } else {
          console.error("Failed to fetch PDF:", response.message, response.error);
          setError(response.message || "Failed to load PDF document.");
        }
      } catch (e) {
        console.error("Error fetching document:", e);
        setError(e instanceof Error ? e.message : "An unexpected error occurred.");
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
  const handleDocumentSave = async (inputDoc: any) => {
    setIsSaving(true);
    try {
      // Here you would normally implement save functionality
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulating API call
      toast.success("Document processed successfully!");

      // Return a properly formatted Document type
      const savedDoc: DocumentType = {
        id: inputDoc.id,
        title: inputDoc.title,
        description: inputDoc.description,
        authorId: inputDoc.authorId,
        authorName: inputDoc.authorName,
        authorEmail: inputDoc.authorEmail,
        status: inputDoc.status,
        key: inputDoc.key || "",
        type: inputDoc.type || "default",
        createdAt: inputDoc.createdAt || new Date(),
        updatedAt: new Date(),
        preparedAt: inputDoc.preparedAt,
        sentAt: inputDoc.sentAt,
        signedAt: inputDoc.signedAt,
        expiresAt: inputDoc.expiresAt,
        enableWatermark: inputDoc.enableWatermark,
        watermarkText: inputDoc.watermarkText,
        fields: inputDoc.fields,
        signer: inputDoc.signer
          ? {
              id: inputDoc.signer.id,
              documentId: inputDoc.signer.documentId || inputDoc.id,
              email: inputDoc.signer.email,
              name: inputDoc.signer.name,
              role: inputDoc.signer.role,
              status: inputDoc.signer.status || "PENDING",
              accessCode: inputDoc.signer.accessCode,
              invitedAt: inputDoc.signer.invitedAt,
              viewedAt: inputDoc.signer.viewedAt,
              completedAt: inputDoc.signer.completedAt,
              notifiedAt: inputDoc.signer.notifiedAt,
              declinedAt: inputDoc.signer.declinedAt,
              declineReason: inputDoc.signer.declineReason,
              color: inputDoc.signer.color,
            }
          : undefined,
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
      <Card className="w-full max-w-7xl mx-auto my-8 border-border shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="size-4 text-primary" />
            </div>
            Loading Document...
          </CardTitle>
          <CardDescription>Please wait while the document is being loaded.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
            <Progress value={30} className="w-full max-w-md" />
            <p className="text-muted-foreground">Retrieving document data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !pdfData) {
    return (
      <Card className="w-full max-w-7xl mx-auto my-8 border-border shadow-lg">
        <CardHeader className="border-b border-border bg-destructive/5">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-4 text-destructive" />
            </div>
            Error Loading Document
          </CardTitle>
          <CardDescription>There was an issue retrieving the document.</CardDescription>
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
        <CardFooter className="border-t p-4 flex justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href={backLink}>
              <ArrowLeft className="size-4 mr-2" /> Back
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
                    status: document.signers[0].status as "PENDING" | "COMPLETED" | "DECLINED" | "VIEWED",
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
        onSaveAction={handleDocumentSave}
      />

      <Card className="w-full max-w-7xl mx-auto my-6 border-border shadow-lg">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="size-4 text-primary" />
                </div>
                {document.title}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">{document.description || "View the document and check its details below."}</CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(document.status)} className="text-xs sm:text-sm px-2 py-1 h-auto">
              {document.status === "COMPLETED" && <Check className="size-3 mr-1" />}
              {document.status === "PENDING" && <Clock className="size-3 mr-1" />}
              {document.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="document" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-0 bg-muted/50">
              <TabsTrigger value="document" className="rounded-none border-r py-3">
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
                    <AlertTriangle className="size-4" /> There was an issue refreshing the document: {error}. Displaying cached or previous version.
                  </p>
                </div>
              )}

              {!pdfData && !error && (
                <div className="flex flex-col items-center justify-center h-96 border-b m-6 rounded-md bg-muted/20">
                  <FileText className="size-12 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No document preview available.</p>
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
                          <FileText className="size-3.5" /> Title:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{document.title}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Shield className="size-3.5" /> Status:
                        </p>
                        <Badge variant={getStatusBadgeVariant(document.status)} className="mt-1">
                          {document.status}
                        </Badge>
                      </div>
                      {document.description && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <Info className="size-3.5" /> Description:
                          </p>
                          <p className="text-muted-foreground whitespace-pre-wrap bg-background/50 p-1.5 rounded border">{document.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <UserIcon className="size-3.5" /> Author:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{author?.name || author?.email || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Calendar className="size-3.5" /> Created:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{formatDate(document.createdAt)}</p>
                      </div>
                      {document.hash && (
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <Hash className="size-3.5" /> Document Hash:
                          </p>
                          <p className="text-muted-foreground break-all text-xs font-mono bg-background/50 p-1.5 rounded border">{document.hash}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Clock className="size-5 text-primary" />
                      Document Timeline
                    </h3>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm rounded-lg bg-muted/20 p-4">
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Calendar className="size-3.5" /> Created At:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{formatDate(document.createdAt)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Calendar className="size-3.5" /> Updated At:
                        </p>
                        <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{formatDate(document.updatedAt)}</p>
                      </div>
                      {document.preparedAt && (
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <Calendar className="size-3.5" /> Prepared At:
                          </p>
                          <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{formatDate(document.preparedAt)}</p>
                        </div>
                      )}
                      {document.sentAt && (
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <Calendar className="size-3.5" /> Sent At:
                          </p>
                          <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{formatDate(document.sentAt)}</p>
                        </div>
                      )}
                      {/* Remove viewedAt since it's not available in the document type */}
                      {document.signedAt && (
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <Calendar className="size-3.5" /> Signed At:
                          </p>
                          <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{formatDate(document.signedAt)}</p>
                        </div>
                      )}
                      {document.expiresAt && (
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                            <Calendar className="size-3.5" /> Expires At:
                          </p>
                          <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{formatDate(document.expiresAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signer Information */}
                  {document.signers && document.signers.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <UserIcon className="size-5 text-primary" />
                        Signer Information
                      </h3>
                      <Separator />
                      <div className="rounded-lg bg-muted/20 p-4">
                        {document.signers.map((signer) => (
                          <div key={signer.id} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div>
                              <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                                <UserIcon className="size-3.5" /> Name:
                              </p>
                              <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{signer.name || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                                <Info className="size-3.5" /> Email:
                              </p>
                              <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{signer.email}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                                <Info className="size-3.5" /> Status:
                              </p>
                              <Badge variant={getStatusBadgeVariant(signer.status)} className="mt-1">
                                {signer.status}
                              </Badge>
                            </div>
                            {signer.role && (
                              <div>
                                <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                                  <Info className="size-3.5" /> Role:
                                </p>
                                <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{signer.role}</p>
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
        <CardFooter className="border-t p-4 flex justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href={backLink}>
              <ArrowLeft className="size-4 mr-2" /> Back
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
