"use client";

import { useState, useEffect } from "react";
import { Document as PrismaDocument, User, DocumentStatus, DocumentType } from "@prisma/client";
import { getFromR2 } from "@/actions/r2";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, AlertCircle, FileText, Share2, Copy, CheckCircle, Clock, Ban, Calendar, Pencil, UserPlus, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { PDFViewerProps, PdfAnnotation } from "@/components/admin/pdf-viewer";

// Dynamically import the PDF components to avoid SSR issues
const PDFViewer = dynamic<PDFViewerProps>(() => import("@/components/admin/pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[500px] w-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-sm text-muted-foreground">Loading PDF viewer...</p>
    </div>
  ),
});

interface SingleDocumentComponentProps {
  document: PrismaDocument;
  author: User;
  signee?: User | null;
  currentUser?: User;
}

export function SingleDocumentComponent({ document, author, signee, currentUser }: SingleDocumentComponentProps) {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("document");
  const [showSignaturePrompt, setShowSignaturePrompt] = useState(false);
  const [copyLinkTooltip, setCopyLinkTooltip] = useState("Copy link");

  // Fetch PDF data from R2 storage
  useEffect(() => {
    const fetchPdf = async () => {
      if (!document.key) {
        setPdfError("No file key available");
        setIsLoading(false);
        return;
      }

      try {
        const result = await getFromR2({
          Bucket: process.env.R2_BUCKET_NAME || "",
          Key: document.key,
        });

        if (!result.success) {
          setPdfError(result.message || "Failed to load document");
          setIsLoading(false);
          return;
        }

        // Process the response
        if (result.data.Body) {
          // Check if it's an async iterable (ReadableStream)
          if (Symbol.asyncIterator in result.data.Body) {
            try {
              // Read the stream
              const chunks = [];
              for await (const chunk of result.data.Body) {
                chunks.push(chunk);
              }

              // Determine total length
              let totalLength = 0;
              for (const chunk of chunks) {
                totalLength += chunk.length;
              }

              // Combine chunks into a single Uint8Array
              const combinedArray = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of chunks) {
                combinedArray.set(chunk, offset);
                offset += chunk.length;
              }

              // Set the result
              setPdfData(combinedArray.buffer);
              setIsLoading(false);
              return;
            } catch (streamError) {
              console.error("Error reading async iterable:", streamError);
              setPdfError(`Error processing document stream: ${streamError instanceof Error ? streamError.message : "Unknown error"}`);
              setIsLoading(false);
              return;
            }
          }

          // Handle other data formats
          setPdfError("Unsupported document format");
          setIsLoading(false);
        } else {
          setPdfError("Empty document response");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("PDF fetch error:", error);
        setPdfError(error instanceof Error ? error.message : "Unknown error loading document");
        setIsLoading(false);
      }
    };

    fetchPdf();
  }, [document.key]);

  // Download document
  const handleDownload = async () => {
    if (!pdfData || !document.fileName) return;

    const blob = new Blob([pdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.fileName;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle signatures
  const handleSaveAnnotations = async (annotations: PdfAnnotation[]) => {
    // In a real app this would save to API/database
    console.log("Saving annotations:", annotations);
    if (annotations.some((a) => a.type === "signature")) {
      toast.success("Signature successfully added to document");
    } else {
      toast.success("Annotations saved successfully");
    }
    return Promise.resolve();
  };

  const handleSignDocument = () => {
    setShowSignaturePrompt(true);
    setActiveTab("document");
    toast("Place your signature on the document", {
      description: "Click where you want to place your signature and then save it.",
      action: {
        label: "Got it",
        onClick: () => setShowSignaturePrompt(false),
      },
    });
  };

  const handleCopyLink = () => {
    // In a real app this would be the actual shareable link
    const shareableLink = `${window.location.origin}/documents/${document.id}`;
    navigator.clipboard.writeText(shareableLink);
    setCopyLinkTooltip("Copied!");
    setTimeout(() => setCopyLinkTooltip("Copy link"), 2000);
    toast.success("Link copied to clipboard");
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case DocumentStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Clock className="size-3" />
            Pending
          </Badge>
        );
      case DocumentStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
            <CheckCircle className="size-3" />
            Approved
          </Badge>
        );
      case DocumentStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
            <Ban className="size-3" />
            Rejected
          </Badge>
        );
      case DocumentStatus.EXPIRED:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1">
            <Calendar className="size-3" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{document.status}</Badge>;
    }
  };

  const getTypeBadge = () => {
    switch (document.documentType) {
      case DocumentType.SIGNED:
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
            <CheckCircle className="size-3" />
            Signed
          </Badge>
        );
      case DocumentType.UNSIGNED:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <AlertTriangle className="size-3" />
            Unsigned
          </Badge>
        );
      default:
        return <Badge variant="outline">{document.documentType}</Badge>;
    }
  };

  const canSign = Boolean(currentUser && signee && currentUser.id === signee.id && document.status === "PENDING");
  const isReadOnly = !canSign;

  return (
    <div className="container py-6 mx-auto max-w-7xl space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  {document.title || document.fileName || "Document"}
                </CardTitle>
                {getStatusBadge()}
              </div>
              <CardDescription>{document.description || "No description available"}</CardDescription>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copyLinkTooltip}</TooltipContent>
              </Tooltip>

              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!pdfData}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>

              {canSign && (
                <Button size="sm" onClick={handleSignDocument}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sign Document
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-2">
            <TabsList className="grid grid-cols-2 max-w-[400px]">
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="document" className="pt-2 px-6 pb-6">
            {/* PDF Document Viewer */}
            <div className="relative w-full border rounded-md bg-muted/30 flex justify-center min-h-[650px] overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col py-8 my-8 items-center justify-center h-full w-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Loading document...</p>
                </div>
              ) : pdfError ? (
                <div className="flex flex-col py-8 my-8 items-center justify-center h-full w-full p-4">
                  <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                  <p className="text-sm text-destructive font-medium">Failed to load document</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">{pdfError}</p>
                </div>
              ) : (
                <PDFViewer pdfData={pdfData} allowAnnotations={canSign} allowSignature={canSign} readOnly={isReadOnly} onSaveAnnotations={handleSaveAnnotations} documentId={document.id} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 px-6">
              {/* Document metadata */}
              <div className="space-y-6">
                <div className="bg-muted/20 rounded-lg p-4 border">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Document Information
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <p className="text-xs text-muted-foreground">Document ID:</p>
                      <p className="text-sm font-medium break-all">{document.id}</p>

                      <p className="text-xs text-muted-foreground">File Name:</p>
                      <p className="text-sm font-medium break-all line-clamp-1">{document.fileName || "Unknown"}</p>

                      <p className="text-xs text-muted-foreground">Type:</p>
                      <div>{getTypeBadge()}</div>

                      <p className="text-xs text-muted-foreground">Status:</p>
                      <div>{getStatusBadge()}</div>

                      {document.description && (
                        <>
                          <p className="text-xs text-muted-foreground">Description:</p>
                          <p className="text-sm font-medium break-all">{document.description || "No description available"}</p>
                        </>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <p className="text-xs text-muted-foreground">Created:</p>
                      <p className="text-sm">{document.createdAt ? format(new Date(document.createdAt), "PPp") : "Unknown"}</p>

                      <p className="text-xs text-muted-foreground">Updated:</p>
                      <p className="text-sm">{document.updatedAt ? format(new Date(document.updatedAt), "PPp") : "Unknown"}</p>

                      {document.signedAt && (
                        <>
                          <p className="text-xs text-muted-foreground">Signed:</p>
                          <p className="text-sm">{format(new Date(document.signedAt), "PPp")}</p>
                        </>
                      )}
                    </div>

                    {document.hash && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Document Hash:</p>
                          <p className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto break-all">{document.hash}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-muted/20 rounded-lg p-4 border">
                  <h3 className="text-sm font-semibold mb-3">People</h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={author.image || undefined} alt={author.name || "Author"} />
                        <AvatarFallback>{author.name?.charAt(0) || "A"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium flex items-center">
                          {author.name || "Unknown"}
                          <Badge variant="outline" className="ml-2 text-xs">
                            Author
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">{author.email}</p>
                      </div>
                    </div>

                    {signee && (
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={signee.image || undefined} alt={signee.name || "Signee"} />
                          <AvatarFallback>{signee.name?.charAt(0) || "S"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium flex items-center">
                            {signee.name}
                            <Badge variant="outline" className="ml-2 text-xs">
                              Signee
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">{signee.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
