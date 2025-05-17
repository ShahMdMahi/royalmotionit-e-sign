"use client";

import {
  Document as PrismaDocument,
  User,
  DocumentField as PrismaDocumentField,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { getFromR2 } from "@/actions/r2";
import { PDFViewer } from "../common/pdf-viewer";
import { format } from "date-fns";

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
import { FileText, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DocumentToolbar } from "../document/document-toolbar";
import { toast } from "sonner";
import { Document as DocumentType, Signer } from "@/types/document";

// Define a custom signer type that aligns with both the DB schema and our type
type DocumentSigner = Omit<Signer, "name"> & {
  name?: string | undefined; // Replace null with undefined
};

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
  author?: User;
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part?.[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDateTime = (date: Date | string) => {
    return format(new Date(date), "PPP p");
  };

  // Handle document actions
  const handleDocumentSave = async (doc: any) => {
    setIsSaving(true);
    try {
      // Here you would normally implement save functionality
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulating API call
      toast.success("Document processed successfully!");

      // Return a properly formatted Document type
      const savedDoc: DocumentType = {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        authorId: doc.authorId,
        authorName: doc.authorName,
        authorEmail: doc.authorEmail,
        status: doc.status,
        key: doc.key || "",
        type: doc.type || "default",
        createdAt: doc.createdAt || new Date(),
        updatedAt: new Date(),
        preparedAt: doc.preparedAt,
        sentAt: doc.sentAt,
        viewedAt: doc.viewedAt,
        signedAt: doc.signedAt,
        expiresAt: doc.expiresAt,
        enableWatermark: doc.enableWatermark,
        watermarkText: doc.watermarkText,
        fields: doc.fields,
        signer: doc.signer
          ? {
              id: doc.signer.id,
              documentId: doc.signer.documentId || doc.id,
              email: doc.signer.email,
              name: doc.signer.name,
              role: doc.signer.role,
              status: doc.signer.status || "PENDING",
              accessCode: doc.signer.accessCode,
              invitedAt: doc.signer.invitedAt,
              viewedAt: doc.signer.viewedAt,
              completedAt: doc.signer.completedAt,
              notifiedAt: doc.signer.notifiedAt,
              declinedAt: doc.signer.declinedAt,
              declineReason: doc.signer.declineReason,
              color: doc.signer.color,
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
          <CardDescription>
            Please wait while the document is being loaded.
          </CardDescription>
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
        onSaveAction={handleDocumentSave}
      />
      {/* Keep the original toolbar hidden for compatibility */}{" "}
      <div className="hidden">
        <DocumentToolbar
          document={
            {
              ...document,
              type: "default",
              description: document.description || undefined, // Convert null to undefined
              key: document.key || "", // Ensure key is never null
              signer:
                document.signers && document.signers.length > 0
                  ? {
                      ...document.signers[0],
                      documentId: document.signers[0].documentId || document.id,
                      name: document.signers[0].name || undefined, // Convert null to undefined
                      role: document.signers[0].role || undefined, // Convert null to undefined
                      status: document.signers[0].status as
                        | "PENDING"
                        | "COMPLETED"
                        | "DECLINED"
                        | "VIEWED",
                    }
                  : undefined,
            } as DocumentType
          }
          isSaving={isSaving}
          onSaveAction={handleDocumentSave}
        />
      </div>{" "}
      {pdfData && (
        <div className="w-full border-b overflow-hidden p-0 mt-4">
          <div className="aspect-[1/1.4] w-full mx-auto">
            <PDFViewer pdfData={pdfData} />
          </div>
        </div>
      )}
    </div>
  );
}
