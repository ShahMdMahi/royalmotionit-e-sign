"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container max-w-7xl mx-auto my-8 px-4">
      <Card className="w-full border-border shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="size-4 text-destructive" />
            </div>
            Something went wrong
          </CardTitle>
          <CardDescription>
            We encountered an error while processing your request
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-[40vh] space-y-6">
            <div className="text-center max-w-md">
              <p className="text-muted-foreground mb-4">
                {error.message ||
                  "An unexpected error occurred. Please try again later."}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {error.digest && `Error ID: ${error.digest}`}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border p-6 flex justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
