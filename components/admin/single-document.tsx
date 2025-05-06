"use client";

import { Document, User, DocumentField } from "@prisma/client"; // Added DocumentField
import { getFromR2 } from "@/actions/r2";
import { PDFViewer } from "../common/pdf-viewer";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface SignleDocumentComponentProps {
  document: Document & { fields?: DocumentField[] }; // Updated document type
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

  if (isLoading) {
    return (
      <Card className="w-full max-w-5xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Loading Document...</CardTitle>
          <CardDescription>Please wait while the document is being loaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-96">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !pdfData) {
    return (
      <Card className="w-full max-w-5xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Error Loading Document</CardTitle>
          <CardDescription>There was an issue retrieving the document.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-96 text-destructive">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-5xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">{document.title}</CardTitle>
        <CardDescription>Review the document or check its details below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="document" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="document" className="pt-6">
            {error && pdfData && (
              <div className="mb-4 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                <p>Warning: There was an issue refreshing the document: {error}. Displaying cached or previous version.</p>
              </div>
            )}
            {!pdfData && !error && (
              <div className="flex flex-col items-center justify-center h-96 border rounded-md">
                <p className="text-muted-foreground">No document preview available.</p>
              </div>
            )}
            {pdfData && (
              <div className="aspect-[8.5/9] w-full border rounded-md overflow-hidden">
                <PDFViewer pdfData={pdfData} />
              </div>
            )}
          </TabsContent>
          <TabsContent value="details" className="pt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Document Information</h3>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="font-semibold">Document ID:</p>
                  <p className="text-muted-foreground break-all">{document.id}</p>
                </div>
                <div>
                  <p className="font-semibold">File Name:</p>
                  <p className="text-muted-foreground">{document.fileName || "N/A"}</p>
                </div>
                {document.url && (
                  <div className="sm:col-span-2">
                    <p className="font-semibold">Document URL:</p>
                    <a href={document.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {document.url}
                    </a>
                  </div>
                )}
                <div>
                  <p className="font-semibold">Title:</p>
                  <p className="text-muted-foreground">{document.title}</p>
                </div>
                {document.description && (
                  <div className="sm:col-span-2">
                    <p className="font-semibold">Description:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{document.description}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold">Status:</p>
                  <Badge
                    variant={document.status === "APPROVED" ? "success" : document.status === "REJECTED" ? "destructive" : document.status === "PENDING" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {document.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold">Document Type:</p>
                  <p className="text-muted-foreground">{document.documentType}</p>
                </div>
                {document.hash && (
                  <div className="sm:col-span-2">
                    <p className="font-semibold">File Hash (SHA256):</p>
                    <p className="text-muted-foreground break-all text-xs">{document.hash}</p>
                  </div>
                )}
              </div>
            </div>

            {document.fields && Array.isArray(document.fields) && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Interactive Fields</h3>
                <Separator />
                <div className="text-sm">
                  <p className="font-semibold">Number of Fields:</p>
                  <p className="text-muted-foreground">{document.fields.length > 0 ? document.fields.length : "No interactive fields defined."}</p>
                  {/* Optionally, you could list field labels here if needed and available */}
                  {document.fields.length > 0 && (
                    <ul className="list-disc list-inside pl-4 mt-1">
                      {document.fields.map(
                        (
                          field: DocumentField,
                          index: number // Updated field type
                        ) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            {field.label || `Field ${index + 1}`}
                            {field.required ? " (Required)" : ""}
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-lg font-medium">People</h3>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="font-semibold">Author:</p>
                  <p className="text-muted-foreground">{author.name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{author.email}</p>
                </div>
                {signee && (
                  <div>
                    <p className="font-semibold">Signee:</p>
                    <p className="text-muted-foreground">{signee.name || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">{signee.email}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Dates & Timeline</h3>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="font-semibold">Uploaded On:</p>
                  <p className="text-muted-foreground">{format(new Date(document.createdAt), "PPP p")}</p>
                </div>
                <div>
                  <p className="font-semibold">Last Updated:</p>
                  <p className="text-muted-foreground">{format(new Date(document.updatedAt), "PPP p")}</p>
                </div>
                {document.signedAt && (
                  <div>
                    <p className="font-semibold">Signed On:</p>
                    <p className="text-muted-foreground">{format(new Date(document.signedAt), "PPP p")}</p>
                  </div>
                )}
                {document.expiresAt && (
                  <div>
                    <p className="font-semibold">Expires On:</p>
                    <p className="text-muted-foreground">{format(new Date(document.expiresAt), "PPP p")}</p>
                  </div>
                )}
                {document.preparedAt && (
                  <div>
                    <p className="font-semibold">Prepared On:</p>
                    <p className="text-muted-foreground">{format(new Date(document.preparedAt), "PPP p")}</p>
                  </div>
                )}
                {document.dueDate && (
                  <div>
                    <p className="font-semibold">Due Date:</p>
                    <p className="text-muted-foreground">{format(new Date(document.dueDate), "PPP")}</p>
                  </div>
                )}
                {document.expiresInDays !== null && typeof document.expiresInDays === "number" && (
                  <div>
                    <p className="font-semibold">Expires In:</p>
                    <p className="text-muted-foreground">{document.expiresInDays} day(s)</p>
                  </div>
                )}
              </div>
            </div>

            {document.message && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Associated Message</h3>
                <Separator />
                <div className="text-sm p-4 bg-muted/50 rounded-md border">
                  <p className="text-muted-foreground whitespace-pre-wrap">{document.message}</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      {/* <CardFooter>  Potentially add actions here later if needed </CardFooter> */}
    </Card>
  );
}
