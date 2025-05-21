"use client";

import { useState } from "react";
import { Document, DocumentField, Signer } from "@/types/document";
import { EditDocument } from "@/components/document/edit-document";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  saveDocumentSigners,
  sendDocumentForSigning,
} from "@/actions/document";
import { SignerManager } from "@/components/document/signer-manager";
import {
  AlertCircle,
  ArrowRight,
  Check,
  FilePen,
  Send,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PrepareDocumentProps {
  document: Document;
  pdfData: Uint8Array;
  fields?: DocumentField[];
  signers?: Signer[];
}

export function PrepareDocument({
  document,
  pdfData,
  fields = [],
  signers = [],
}: PrepareDocumentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("design");
  const [documentFields, setDocumentFields] = useState<DocumentField[]>(fields);
  const [documentSigners, setDocumentSigners] = useState<Signer[]>(signers);
  const [completionMessage, setCompletionMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate document before sending
  const validateDocument = (): boolean => {
    const errors: string[] = [];

    // Check if we have at least one field
    if (documentFields.length === 0) {
      errors.push("Add at least one field to the document");
    }

    // Check if we have at least one signer
    if (documentSigners.length === 0) {
      errors.push("Add at least one signer to the document");
    }

    // Check if all required fields have a signer assigned
    const requiredFieldsWithoutSigner = documentFields.filter(
      (field) => field.required && !field.signerId,
    );

    if (requiredFieldsWithoutSigner.length > 0) {
      errors.push(
        `Assign signers to ${requiredFieldsWithoutSigner.length} required field(s)`,
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle document sending
  const handleSendDocument = async () => {
    if (!validateDocument()) return;

    setIsSending(true);
    try {
      const result = await sendDocumentForSigning(
        document.id,
        completionMessage,
      );

      if (result.success) {
        toast.success("Document sent for signing");
        router.push("/documents");
      } else {
        toast.error(result.message || "Failed to send document");
      }
    } catch (error) {
      console.error("Error sending document:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

  // Helper to check if we can proceed to review
  const canProceedToReview =
    documentFields.length > 0 && documentSigners.length > 0;

  return (
    <div className="flex flex-col h-full">
      <Tabs
        defaultValue="design"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b mb-4">
          <div className="container flex items-center justify-between py-4">
            <TabsList>
              <TabsTrigger value="design" disabled={isSending}>
                <FilePen className="mr-2 h-4 w-4" />
                Design
              </TabsTrigger>
              <TabsTrigger value="recipients" disabled={isSending}>
                <Upload className="mr-2 h-4 w-4" />
                Recipients
              </TabsTrigger>
              <TabsTrigger
                value="review"
                disabled={!canProceedToReview || isSending}
              >
                <Check className="mr-2 h-4 w-4" />
                Review & Send
              </TabsTrigger>
            </TabsList>

            {activeTab === "review" && (
              <Button
                onClick={handleSendDocument}
                disabled={isSending || validationErrors.length > 0}
              >
                {isSending ? "Sending..." : "Send Document"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            )}

            {activeTab !== "review" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (activeTab === "design") {
                    setActiveTab("recipients");
                  } else if (activeTab === "recipients" && canProceedToReview) {
                    validateDocument();
                    setActiveTab("review");
                  }
                }}
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="container pb-16">
          <TabsContent value="design" className="m-0">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Design Document</CardTitle>
                <CardDescription>
                  Add fields to your document by dragging them from the left
                  panel.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="h-[calc(100vh-240px)]">
              <EditDocument
                document={document}
                pdfData={pdfData}
                initialFields={documentFields}
              />
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Document Recipients</CardTitle>
                <CardDescription>
                  Add or edit recipients who will sign this document.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SignerManager documentId={document.id} />

                {/* Sequential signing option removed for single signer system */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Review & Send</CardTitle>
                <CardDescription>
                  Review your document before sending it to signers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Cannot send document</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="completion-message">
                      Completion Message (Optional)
                    </Label>
                    <Input
                      id="completion-message"
                      placeholder="Thank you for signing this document."
                      value={completionMessage}
                      onChange={(e) => setCompletionMessage(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Document Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Title:</div>
                    <div>{document.title}</div>
                    <div className="font-medium">Fields:</div>
                    <div>{documentFields.length}</div>
                    <div className="font-medium">Signer:</div>
                    <div>
                      {documentSigners.length > 0
                        ? documentSigners[0].name || documentSigners[0].email
                        : "Not added"}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("recipients")}
                >
                  Back to Recipients
                </Button>
                <Button
                  onClick={handleSendDocument}
                  disabled={isSending || validationErrors.length > 0}
                >
                  {isSending ? "Sending..." : "Send Document"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
