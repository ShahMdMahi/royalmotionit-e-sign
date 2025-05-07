"use client";

import { Document, User, DocumentField } from "@prisma/client";
import { getFromR2 } from "@/actions/r2";
import { PDFViewer } from "../common/pdf-viewer";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, Check, Clock, Calendar, User as UserIcon, Mail, Hash, FileSignature, Info, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SignleDocumentComponentProps {
  document: Document & { fields?: DocumentField[] };
  author: User;
  signee: User | null;
}

export function SingleDocumentComponent({ document, author, signee }: SignleDocumentComponentProps) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part?.[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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
          <CardDescription>Please wait while the document is being loaded.</CardDescription>
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
      </Card>
    );
  }

  return (
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
            <CardDescription className="text-sm sm:text-base">{document.description || "Review the document or check its details below."}</CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(document.status)} className="text-xs sm:text-sm px-2 py-1 h-auto">
            {document.status === "APPROVED" && <Check className="size-3 mr-1" />}
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
                <div className="aspect-[1.414/1] w-full mx-auto">
                  <PDFViewer pdfData={pdfData} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="pt-0 border-t">
            <ScrollArea className="max-h-[80vh]">
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
                      <p className="text-muted-foreground break-all bg-background/50 p-1.5 rounded border text-xs font-mono">{document.id}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                        <FileText className="size-3.5" /> File Name:
                      </p>
                      <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{document.fileName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                        <FileSignature className="size-3.5" /> Title:
                      </p>
                      <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{document.title}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                        <Shield className="size-3.5" /> Document Type:
                      </p>
                      <p className="text-muted-foreground bg-background/50 p-1.5 rounded border">{document.documentType}</p>
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
                        <Shield className="size-3.5" /> Status:
                      </p>
                      <Badge variant={getStatusBadgeVariant(document.status)} className="mt-1">
                        {document.status}
                      </Badge>
                    </div>
                    {document.hash && (
                      <div className="sm:col-span-2">
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Hash className="size-3.5" /> File Hash (SHA256):
                        </p>
                        <p className="text-muted-foreground break-all text-xs font-mono bg-background/50 p-1.5 rounded border">{document.hash}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Fields */}
                {document.fields && Array.isArray(document.fields) && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <FileSignature className="size-5 text-primary" />
                      Interactive Fields
                    </h3>
                    <Separator />
                    <div className="rounded-lg bg-muted/20 p-4">
                      <div className="text-sm mb-2">
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Info className="size-3.5" /> Number of Fields:
                        </p>
                        <p className="text-muted-foreground">{document.fields.length > 0 ? document.fields.length : "No interactive fields defined."}</p>
                      </div>
                      {document.fields.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {document.fields.map((field: DocumentField, index: number) => (
                            <div key={index} className={`text-xs p-2 rounded flex items-center gap-2 ${field.required ? "bg-primary/5 border border-primary/20" : "bg-background"}`}>
                              <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <FileSignature className="size-3 text-primary" />
                              </div>
                              <div>
                                <span>{field.label || `Field ${index + 1}`}</span>
                                {field.required && <span className="text-primary text-[10px] ml-1.5">(Required)</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* People */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <UserIcon className="size-5 text-primary" />
                    People
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/20 p-4 flex items-start gap-3">
                      <Avatar className="size-10 border-2 border-primary/20">
                        <AvatarImage src={author.image ?? undefined} alt={author.name ?? "Author"} />
                        <AvatarFallback className="bg-primary/10 text-primary">{getInitials(author.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-1.5">
                          <UserIcon className="size-3.5" /> Author:
                        </p>
                        <p className="text-muted-foreground font-medium">{author.name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="size-3" />
                          {author.email}
                        </p>
                      </div>
                    </div>

                    {signee && (
                      <div className="rounded-lg bg-muted/20 p-4 flex items-start gap-3">
                        <Avatar className="size-10 border-2 border-primary/20">
                          <AvatarImage src={signee.image ?? undefined} alt={signee.name ?? "Signee"} />
                          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(signee.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-primary flex items-center gap-1.5">
                            <UserIcon className="size-3.5" /> Signee:
                          </p>
                          <p className="text-muted-foreground font-medium">{signee.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="size-3" />
                            {signee.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates & Timeline */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="size-5 text-primary" />
                    Dates & Timeline
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                        <Clock className="size-3.5" /> Created On:
                      </p>
                      <p className="text-muted-foreground">{format(new Date(document.createdAt), "PPP p")}</p>
                    </div>

                    <div className="bg-muted/20 p-4 rounded-lg">
                      <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                        <Clock className="size-3.5" /> Last Updated:
                      </p>
                      <p className="text-muted-foreground">{format(new Date(document.updatedAt), "PPP p")}</p>
                    </div>

                    {document.signedAt && (
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <FileSignature className="size-3.5" /> Signed On:
                        </p>
                        <p className="text-muted-foreground">{format(new Date(document.signedAt), "PPP p")}</p>
                      </div>
                    )}

                    {document.expiresAt && (
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Calendar className="size-3.5" /> Expires On:
                        </p>
                        <p className="text-muted-foreground">{format(new Date(document.expiresAt), "PPP p")}</p>
                      </div>
                    )}

                    {document.preparedAt && (
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Clock className="size-3.5" /> Prepared On:
                        </p>
                        <p className="text-muted-foreground">{format(new Date(document.preparedAt), "PPP p")}</p>
                      </div>
                    )}

                    {document.dueDate && (
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                          <Calendar className="size-3.5" /> Due Date:
                        </p>
                        <p className="text-muted-foreground">{format(new Date(document.dueDate), "PPP")}</p>
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
        <Button variant="outline" size="sm">
          <FileText className="size-4 mr-2" /> Download
        </Button>
        <Button size="sm">
          <FileSignature className="size-4 mr-2" /> View Signatures
        </Button>
      </CardFooter>
    </Card>
  );
}
