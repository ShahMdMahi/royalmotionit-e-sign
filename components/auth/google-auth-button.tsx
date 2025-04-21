"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { googleAuth } from "@/actions/auth";
import { toast } from "sonner";
import { AuthError } from "next-auth";

interface GoogleAuthButtonProps {
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  fullWidth?: boolean;
  className?: string;
}

export function GoogleAuthButton({ variant = "outline", fullWidth = true, className = "" }: GoogleAuthButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleGoogleAuth = () => {
    startTransition(async () => {
      try {
        toast.info("Redirecting to Google authentication...");
        const { redirectUrl, message } = await googleAuth();
        console.log("Google auth response - redirectUrl:", redirectUrl);

        if (message) {
          toast.error(message);
          return;
        }

        if (redirectUrl) {
          console.log("Redirecting to:", redirectUrl);
          window.location.href = redirectUrl;
        } else {
          toast.error("Failed to initiate Google authentication. No redirect URL returned.");
          console.error("No redirect URL returned from Google auth");
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error during Google authentication:", error);
          toast.error(`Google authentication error: ${error.message || "Unknown error"}`);
        } else if (error instanceof AuthError) {
          console.error("Google authentication error:", error);
          toast.error(`Google authentication error: ${error.message}`);
        } else {
          console.error("An unexpected error occurred during Google authentication:", error);
          toast.error("An unexpected error occurred. Please try again.");
        }
      }
    });
  };

  return (
    <Button type="button" variant={variant} className={`h-8 text-sm ${fullWidth ? "w-full" : ""} ${className}`} onClick={handleGoogleAuth} disabled={isPending}>
      {isPending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Redirecting...
        </span>
      ) : (
        <span className="flex items-center">
          <svg className="mr-2 h-3 w-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Continue with Google
        </span>
      )}
    </Button>
  );
}
