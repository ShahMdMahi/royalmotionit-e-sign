"use client";

import { useState, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChangePasswordSchema } from "@/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Save } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changePassword } from "@/actions/user";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type FormData = z.infer<typeof ChangePasswordSchema>;

export function PasswordChangeForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(changePassword, {
    errors: {},
    message: null,
    success: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
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
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  useEffect(() => {
    if (state.success && !isLoading) {
      toast.success(state.message || "Password updated successfully!");
      reset();
      setTimeout(() => {
        router.refresh();
      }, 100);
    }
    if (state.message && !state.success && !isLoading) {
      toast.error(state.message);
    }
  }, [state.success, state.message, isLoading, reset, router]);

  return (
    <Card className="overflow-hidden shadow-lg rounded-lg card-hover border-border">
      <CardHeader className="p-6 border-b border-border">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="size-4 text-primary" />
          </div>
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {state.message && !state.success && (
          <Alert variant="destructive" className="mb-4 py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {state.message}
            </AlertDescription>
          </Alert>
        )}

        <form
          action={formAction}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid gap-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium">
              Current Password
            </Label>
            <PasswordInput
              id="currentPassword"
              {...register("currentPassword")}
              name="currentPassword"
              placeholder="Enter your current password"
              className="border-input"
              disabled={isLoading || isPending}
              aria-invalid={
                !!errors.currentPassword || !!state.errors?.currentPassword
              }
            />
            {(errors.currentPassword || state.errors?.currentPassword) && (
              <p className="text-xs text-red-500 mt-1">
                {errors.currentPassword?.message ||
                  state.errors?.currentPassword?.[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </Label>
            <PasswordInput
              id="newPassword"
              {...register("newPassword")}
              name="newPassword"
              placeholder="Enter your new password"
              className="border-input"
              disabled={isLoading || isPending}
              aria-invalid={!!errors.newPassword || !!state.errors?.newPassword}
            />
            {(errors.newPassword || state.errors?.newPassword) && (
              <p className="text-xs text-red-500 mt-1">
                {errors.newPassword?.message || state.errors?.newPassword?.[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmNewPassword" className="text-sm font-medium">
              Confirm New Password
            </Label>
            <PasswordInput
              id="confirmNewPassword"
              {...register("confirmNewPassword")}
              name="confirmNewPassword"
              placeholder="Confirm your new password"
              className="border-input"
              disabled={isLoading || isPending}
              aria-invalid={
                !!errors.confirmNewPassword ||
                !!state.errors?.confirmNewPassword
              }
            />
            {(errors.confirmNewPassword ||
              state.errors?.confirmNewPassword) && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmNewPassword?.message ||
                  state.errors?.confirmNewPassword?.[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto hover:bg-primary/80 gap-2"
            disabled={isLoading || isPending}
          >
            <Save className="size-4" />
            {isLoading || isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
