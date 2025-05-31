"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyUserEmail } from "@/actions/auth";

interface VerifyEmailProps {
  token: string;
}

export function VerifyEmailForm({ token }: VerifyEmailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Use useEffect to ensure code only runs on client-side
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Call the verification function
        const result = await verifyUserEmail(token);

        if (result.success) {
          setStatus("success");
          setMessage(result.message);
          toast.success(result.message);

          // Redirect to login after successful verification
          setTimeout(() => {
            router.push("/auth/login");
          }, 100);
        } else {
          setStatus("error");
          setMessage(result.message);
          toast.error(result.message);
        }
      } catch {
        setStatus("error");
        setMessage(
          "An error occurred during verification. Please try again later.",
        );
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">Email Verification</h1>
        <p className="text-muted-foreground text-sm">
          {status === "loading"
            ? "Verifying your email address..."
            : status === "success"
              ? "Your email has been verified"
              : "Verification failed"}
        </p>
      </div>

      <div className="space-y-3">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-center text-muted-foreground">
              Verifying your email address. Please wait...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <p className="text-center font-medium">{message}</p>
            <p className="text-center text-muted-foreground text-sm">
              You&apos;ll be redirected to the login page in a few seconds.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{message}</AlertDescription>
            </Alert>
            <div className="text-center text-muted-foreground text-sm mt-2">
              <p>
                If you continue to experience issues, please contact our support
                team.
              </p>
            </div>
          </div>
        )}
      </div>

      {status === "error" ? (
        <div className="space-y-3 mt-6">
          <Button
            onClick={() => router.push("/auth/login")}
            className="w-full h-8 text-sm"
          >
            Return to Login
          </Button>
          <div className="text-center text-xs pt-2">
            Need a new verification link?
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in to request one
            </Link>
          </div>
        </div>
      ) : (
        status === "success" && (
          <div className="mt-6">
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full h-8 text-sm"
              disabled={isLoading}
            >
              Continue to Login
            </Button>
          </div>
        )
      )}
    </div>
  );
}
