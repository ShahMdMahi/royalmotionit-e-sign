"use client";

import { Document, User } from "@prisma/client";
import { getFromR2 } from "@/actions/r2";
import { PDFViewer } from "../common/pdf-viewer";
import { useEffect, useState } from "react";

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
    return <div className="flex justify-center items-center h-full">Loading document...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full text-red-500">Error: {error}</div>;
  }

  if (!pdfData) {
    return <div className="flex justify-center items-center h-full">No PDF data to display.</div>;
  }

  // Pass the Uint8Array directly to PDFViewer
  return <PDFViewer pdfData={pdfData} />;
}
