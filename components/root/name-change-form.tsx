"use client";

import { useState, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChangeNameSchema } from "@/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Save } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changeName } from "@/actions/user";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type FormData = z.infer<typeof ChangeNameSchema>;

export function NameChangeForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(changeName, {
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
    resolver: zodResolver(ChangeNameSchema),
    defaultValues: {
      name: "",
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

  useEffect(() => {
    if (state.success && !isLoading) {
      toast.success(state.message || "Name updated successfully!");
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
            <User className="size-4 text-primary" />
          </div>
          Change Name
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {state.message && !state.success && (
          <Alert variant="destructive" className="mb-4 py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{state.message}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium">
              New Name
            </Label>
            <Input
              id="name"
              {...register("name")}
              name="name"
              placeholder="Enter your new name"
              className="border-input"
              disabled={isLoading || isPending}
              aria-invalid={!!errors.name || !!state.errors?.name}
            />
            {(errors.name || state.errors?.name) && <p className="text-xs text-red-500 mt-1">{errors.name?.message || state.errors?.name?.[0]}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <PasswordInput
              id="password"
              {...register("password")}
              name="password"
              placeholder="Enter your password"
              className="border-input"
              disabled={isLoading || isPending}
              aria-invalid={!!errors.password || !!state.errors?.password}
            />
            {(errors.password || state.errors?.password) && <p className="text-xs text-red-500 mt-1">{errors.password?.message || state.errors?.password?.[0]}</p>}
          </div>
          <Button type="submit" className="w-full sm:w-auto hover:bg-primary/80 gap-2" disabled={isLoading || isPending}>
            <Save className="size-4" />
            {isLoading || isPending ? "Updating..." : "Update Name"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
