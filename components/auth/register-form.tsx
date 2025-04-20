"use client";

import { useState, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

type FormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(registerUser, {
    errors: {},
    message: null,
    success: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
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
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });
  };

  // Show success message after successful form submission
  if (state.success && !isLoading) {
    toast.success("Registration successful! Redirecting to login...");
    setTimeout(() => {
      router.push("/auth/login");
    }, 100);
  }

  // Show error message if there's a failure
  if (state.message && !state.success && !isLoading) {
    toast.error(state.message);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">Create an account</h1>
        <p className="text-muted-foreground text-sm">Enter your information to register</p>
      </div>

      <div className="space-y-3">
        {state.message && !state.success && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{state.message}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="text-xs">
                First name
              </Label>
              <Input id="firstName" {...register("firstName")} name="firstName" placeholder="First Name" className="h-8 text-sm mt-1" aria-invalid={!!errors.firstName || !!state.errors?.firstName} />
              {(errors.firstName || state.errors?.firstName) && <p className="text-xs text-red-500 mt-1">{errors.firstName?.message || state.errors?.firstName?.[0]}</p>}
            </div>

            <div>
              <Label htmlFor="lastName" className="text-xs">
                Last name
              </Label>
              <Input id="lastName" {...register("lastName")} name="lastName" placeholder="Last Name" className="h-8 text-sm mt-1" aria-invalid={!!errors.lastName || !!state.errors?.lastName} />
              {(errors.lastName || state.errors?.lastName) && <p className="text-xs text-red-500 mt-1">{errors.lastName?.message || state.errors?.lastName?.[0]}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input id="email" type="email" {...register("email")} name="email" placeholder="Enter your email" className="h-8 text-sm mt-1" aria-invalid={!!errors.email || !!state.errors?.email} />
            {(errors.email || state.errors?.email) && <p className="text-xs text-red-500 mt-1">{errors.email?.message || state.errors?.email?.[0]}</p>}
          </div>

          <div>
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
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

          <div>
            <Label htmlFor="confirmPassword" className="text-xs">
              Confirm Password
            </Label>
            <PasswordInput
              id="confirmPassword"
              {...register("confirmPassword")}
              name="confirmPassword"
              placeholder="Confirm your password"
              className="h-8 text-sm mt-1"
              aria-invalid={!!errors.confirmPassword || !!state.errors?.confirmPassword}
            />
            {(errors.confirmPassword || state.errors?.confirmPassword) && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword?.message || state.errors?.confirmPassword?.[0]}</p>}
          </div>

          <Button type="submit" className="w-full h-8 text-sm" disabled={isLoading || isPending}>
            {isLoading || isPending ? "Creating account..." : "Register"}
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
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
