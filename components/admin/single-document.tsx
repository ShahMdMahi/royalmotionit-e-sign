"use client";

import { Document, User } from "@prisma/client";
import { getFromR2 } from "@/actions/r2";
import { PDFViewer } from "../common/pdf-viewer";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SignleDocumentComponentProps {
  document: Document;
  author: User;
  signee: User | null;
}

export function SingleDocumentComponent({ document, author, signee }: SignleDocumentComponentProps) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null); // Changed to Uint8Array
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
        // Bucket is handled by the server action getFromR2
        const response = await getFromR2({ Key: document.key });

        if (response.success) {
          // response.data.Body is now a Uint8Array
          if (response.data && response.data.Body) {
            // Store the Uint8Array directly
            setPdfData(response.data.Body);
            setError(null);
          } else {
            // This case should ideally be handled by getFromR2 returning success: false
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
      <Card className="w-full max-w-4xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Loading Document...</CardTitle>
          <CardDescription>Please wait while the document is being loaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Error Loading Document</CardTitle>
          <CardDescription>There was an issue retrieving the document.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64 text-red-500">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pdfData) {
    return (
      <Card className="w-full max-w-4xl mx-auto my-8">
        <CardHeader>
          <CardTitle>No Document Data</CardTitle>
          <CardDescription>The document data could not be displayed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <p>No PDF data to display.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">{document.title}</CardTitle>
        <CardDescription>
          Uploaded by: {author.name} ({author.email}) on {format(new Date(document.createdAt), "PPP")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {" "}
        {/* Remove horizontal padding for PDF viewer on small screens */}
        <div className="aspect-[8.5/11] w-full">
          {" "}
          {/* Maintain aspect ratio for PDF */}
          <PDFViewer pdfData={pdfData} />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Document Status</h4>
          <Badge
            variant={
              document.status === "APPROVED"
                ? "success"
                : document.status === "REJECTED"
                  ? "destructive"
                  : document.status === "PENDING"
                    ? "default" // Changed from "warning" to "default"
                    : "secondary" // For EXPIRED or any other status
            }
          >
            {document.status}
          </Badge>
        </div>
        {signee && (
          <div className="space-y-1 text-sm">
            <h4 className="font-medium">Signee</h4>
            <p>
              {signee.name} ({signee.email})
            </p>
          </div>
        )}
        <div className="space-y-1 text-sm">
          <h4 className="font-medium">Last Updated</h4>
          <p>{format(new Date(document.updatedAt), "PPP p")}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
