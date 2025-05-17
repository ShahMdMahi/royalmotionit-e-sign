"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, ArrowRight, Users, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DownloadButton } from "@/components/document/download-button";

interface SigningCompletedProps {
  documentId: string;
  documentTitle?: string;
  isLastSigner: boolean;
}

export function SigningCompletedDialog({
  documentId,
  documentTitle = "Document",
  isLastSigner,
}: SigningCompletedProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/documents/${documentId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [documentId, router]);

  return (
    <Card className="max-w-md w-full mx-auto border-primary/20 shadow-lg animate-in fade-in-0 zoom-in-95 duration-300">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Document Signed!</CardTitle>
            <CardDescription>
              You have successfully signed &quot;{documentTitle}&quot;.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-center text-muted-foreground">
            Your signature has been recorded. The document is now finalized.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => router.push(`/documents/${documentId}`)}
          >
            <File className="h-4 w-4 mr-2" />
            View Document
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => router.push(`/documents`)}
          >
            <Users className="h-4 w-4 mr-2" />
            All Documents
          </Button>
          {isLastSigner && (
            <DownloadButton
              documentId={documentId}
              fileName={`${documentTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_signed.pdf`}
              className="col-span-2 justify-center mt-1"
              variant="default"
            >
              Download Signed Document
            </DownloadButton>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 flex justify-between">
        <p className="text-xs text-muted-foreground">
          Redirecting in {countdown} seconds...
        </p>
        <Button
          size="sm"
          variant="default"
          onClick={() => router.push(`/documents/${documentId}`)}
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
