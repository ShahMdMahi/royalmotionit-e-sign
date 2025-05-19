"use client";

import React, { useState } from "react";
import { Document, Signer } from "@/types/document";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { sendDocumentForSigning } from "@/actions/document";

interface SendDocumentProps {
  document: Document;
  signers: Signer[];
}

export function SendDocument({ document, signers }: SendDocumentProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  // Sequential signing is not needed for single signer
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({});
  const [completionMessage, setCompletionMessage] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    document.expiresAt,
  );

  // Handle access code changes
  const handleAccessCodeChange = (signerId: string, code: string) => {
    setAccessCodes((prev) => ({
      ...prev,
      [signerId]: code,
    }));
  };

  // Send document
  const handleSend = async () => {
    if (signers.length === 0) {
      toast.error("Add at least one signer before sending");
      return;
    }

    setIsSending(true);
    try {
      // Update signers with access codes if provided
      for (const signerId in accessCodes) {
        if (accessCodes[signerId]) {
          // Here you would update signer access codes in your database
        }
      }

      // Send document for signing (single signer model)
      const result = await sendDocumentForSigning(
        document.id,
        completionMessage,
      );

      if (result.success) {
        toast.success("Document sent successfully");
        router.push(`/documents/${document.id}`);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Document</CardTitle>
        <CardDescription>
          Configure sending options before sending &quot;{document.title}&quot;
          for signature
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Signers</h3>

          {signers.length === 0 ? (
            <div className="text-center p-4 border rounded bg-muted/50">
              No signers added yet. Add signers before sending.
            </div>
          ) : (
            <div className="space-y-4">
              {signers.map((signer) => (
                <div
                  key={signer.id}
                  className="flex flex-col space-y-2 p-3 border rounded"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {signer.name || "Unnamed Signer"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {signer.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor={`accessCode-${signer.id}`}>
                        Access Code (Optional)
                      </Label>
                      <Input
                        id={`accessCode-${signer.id}`}
                        placeholder="Add an access code for extra security"
                        value={accessCodes[signer.id] || ""}
                        onChange={(e) =>
                          handleAccessCodeChange(signer.id, e.target.value)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        If provided, the signer will need to enter this code to
                        access the document
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Signature Settings</h3>

          {/* Sequential signing removed as we're using a single signer */}

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiration Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="expiry"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expirationDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate
                    ? format(expirationDate, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Document will expire if not signed by this date
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-message">
              Completion Message (Optional)
            </Label>
            <Input
              id="completion-message"
              placeholder="Enter a message to display after signing is complete"
              value={completionMessage}
              onChange={(e) => setCompletionMessage(e.target.value)}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={isSending || signers.length === 0}
        >
          {isSending ? "Sending..." : "Send Document"}
          {!isSending && <Send className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
