"use client";

import { useState, useEffect } from "react";
import { Document as PrismaDocument, User } from "@prisma/client";
import { getFromR2 } from "@/actions/r2";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, AlertCircle, FileText } from "lucide-react";
import dynamic from "next/dynamic";

// Import type for PDFViewer props
import type { PDFViewerProps } from "./pdf-viewer"; 

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
}

export function SingleDocumentComponent({ document, author, signee }: SingleDocumentComponentProps) {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        // Detailed logging to understand the response structure
        console.log("R2 response structure:", {
          resultType: typeof result,
          dataType: typeof result.data,
          bodyExists: !!result.data.Body,
          bodyType: typeof result.data.Body,
          bodyConstructor: result.data.Body ? result.data.Body.constructor?.name : null,
          bodyIsAsyncIterable: result.data.Body && Symbol.asyncIterator in result.data.Body,
        });

        // Handle the response based on what R2 actually returns
        if (result.data.Body) {
          // Check if it's an async iterable (ReadableStream)
          if (Symbol.asyncIterator in result.data.Body) {
            console.log("Processing async iterable Body");
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

          // Other data formats handling
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

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {document.title || document.fileName || "Document"}
            </CardTitle>
            <CardDescription>{document.description || "No description available"}</CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="self-start md:self-auto"
            onClick={handleDownload}
            disabled={!pdfData}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        {/* Document metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Author</p>
            <p className="text-sm text-muted-foreground">{author.name || "Unknown"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Signee</p>
            <p className="text-sm text-muted-foreground">{signee?.name || "No signee assigned"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Created</p>
            <p className="text-sm text-muted-foreground">
              {document.createdAt ? new Date(document.createdAt).toLocaleString() : "Unknown"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Status</p>
            <p className="text-sm text-muted-foreground">{document.status || "Unknown"}</p>
          </div>
        </div>

        {/* PDF Document */}
        <div className="relative w-full border rounded-md bg-muted/30 flex justify-center min-h-[500px] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          ) : pdfError ? (
            <div className="flex flex-col items-center justify-center h-full w-full p-4">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-sm text-destructive font-medium">Failed to load document</p>
              <p className="text-xs text-muted-foreground text-center mt-1">{pdfError}</p>
            </div>
          ) : (
            <PDFViewer pdfData={pdfData} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
