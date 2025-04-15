"use client";

import { useState, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";

type FormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const resetPasswordWithToken = resetPassword.bind(null, token);
  const [state, formAction] = useActionState(resetPasswordWithToken, {
    errors: {},
    message: null,
    success: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
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
    toast.success("Password reset successful! Redirecting to login...");
    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  }

  // Show error message if there's a failure
  if (state.message && !state.success && !isLoading) {
    toast.error(state.message);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm">Enter your new password below</p>
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
              <Label htmlFor="password" className="text-xs">
                New Password
              </Label>
              <PasswordInput
                id="password"
                {...register("password")}
                name="password"
                placeholder="Enter new password"
                className="h-8 text-sm mt-1"
                aria-invalid={!!errors.password || !!state.errors?.password}
              />
              {(errors.password || state.errors?.password) && <p className="text-xs text-red-500 mt-1">{errors.password?.message || state.errors?.password?.[0]}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-xs">
                Confirm New Password
              </Label>
              <PasswordInput
                id="confirmPassword"
                {...register("confirmPassword")}
                name="confirmPassword"
                placeholder="Confirm new password"
                className="h-8 text-sm mt-1"
                aria-invalid={!!errors.confirmPassword || !!state.errors?.confirmPassword}
              />
              {(errors.confirmPassword || state.errors?.confirmPassword) && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword?.message || state.errors?.confirmPassword?.[0]}</p>}
            </div>

            <Button type="submit" className="w-full h-8 text-sm" disabled={isLoading || isPending}>
              {isLoading || isPending ? "Resetting password..." : "Reset password"}
            </Button>
          </form>
        )}

        {!state.success && (
          <div className="text-center text-xs pt-2">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
