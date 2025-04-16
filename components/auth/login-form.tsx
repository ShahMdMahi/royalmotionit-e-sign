"use client";

import { useState, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(loginUser, {
    errors: {},
    message: null,
    success: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
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

  // Show success message after successful form submission
  if (state.success && !isLoading) {
    toast.success("Login successful! Redirecting to dashboard...");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  }

  // Show error message if there's a failure
  if (state.message && !state.success && !isLoading) {
    toast.error(state.message);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your account</p>
      </div>

      <div className="space-y-3">
        {state.message && !state.success && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{state.message}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input id="email" type="email" {...register("email")} name="email" placeholder="Enter your email" className="h-8 text-sm mt-1" aria-invalid={!!errors.email || !!state.errors?.email} />
            {(errors.email || state.errors?.email) && <p className="text-xs text-red-500 mt-1">{errors.email?.message || state.errors?.email?.[0]}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <Link href="/auth/forgot-password" className="text-primary hover:underline text-xs">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              {...register("password")}
              name="password"
              placeholder="Enter your password"
              className="h-8 text-sm mt-1"
              aria-invalid={!!errors.password || !!state.errors?.password}
            />
            {(errors.password || state.errors?.password) && <p className="text-xs text-red-500 mt-1">{errors.password?.message || state.errors?.password?.[0]}</p>}
          </div>

          <Button type="submit" className="w-full h-8 text-sm" disabled={isLoading || isPending}>
            {isLoading || isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground text-xs">Or continue with</span>
          </div>
        </div>

        <GoogleAuthButton />

        <div className="text-center text-xs pt-2">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
