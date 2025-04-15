"use client";

import { useState, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { forgotPassword } from "@/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(forgotPassword, {
    errors: {},
    message: null,
    success: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: FormData) => {
    setIsLoading(true);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startTransition(async () => {
      try {
        formAction(formData);
      } catch (error) {
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  // Show success message after successful form submission
  if (state.success && !isLoading) {
    toast.success("Reset link sent! Check your email inbox. Redirecting to home...");
    setTimeout(() => {
      router.push("/");
    }, 2000);
  }

  // Show error message if there's a failure
  if (state.message && !state.success && !isLoading) {
    toast.error(state.message);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm">Enter your email and we'll send you a link to reset your password</p>
      </div>

      <div className="space-y-3">
        {state.message && !state.success && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{state.message}</AlertDescription>
          </Alert>
        )}

        {!state.success && (
          <form action={formAction} onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input id="email" type="email" {...register("email")} name="email" placeholder="Enter your email" className="h-8 text-sm mt-1" aria-invalid={!!errors.email || !!state.errors?.email} />
              {(errors.email || state.errors?.email) && <p className="text-xs text-red-500 mt-1">{errors.email?.message || state.errors?.email?.[0]}</p>}
            </div>

            <Button type="submit" className="w-full h-8 text-sm" disabled={isLoading || isPending}>
              {isLoading || isPending ? "Sending link..." : "Send reset link"}
            </Button>
          </form>
        )}

        <div className="text-center text-xs pt-2">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
