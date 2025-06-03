"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUser } from "@/actions/user";
import { Role } from "@prisma/client";
import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { CreateUserSchema } from "@/schema";
import { z } from "zod";
import { generatePassword } from "@/utils/password-utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof CreateUserSchema>;

interface AddUserDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export function AddUserDialog({ isOpen, onCloseAction }: AddUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER" as Role,
      emailVerified: true,
      notification: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      try {
        setApiError(null);

        // Log form data for debugging
        console.log("Form data being submitted:", {
          name: data.name,
          email: data.email,
          role: data.role,
          emailVerified: data.emailVerified,
          notification: data.notification,
        });

        // Convert form data to FormData object
        const formData = new FormData();
        formData.append("name", data.name.trim());
        formData.append("email", data.email.trim().toLowerCase());
        formData.append("password", data.password);
        formData.append("role", data.role);

        // Handle boolean fields, ensuring they're always included in the FormData
        const emailVerifiedValue = data.emailVerified === true ? "on" : "off";
        const notificationValue = data.notification === true ? "on" : "off";
        formData.append("emailVerified", emailVerifiedValue);
        formData.append("notification", notificationValue);

        // Log what's being sent to the server
        console.log("Values sent to server:", {
          emailVerifiedValue,
          notificationValue,
        });

        const response = await createUser(formData);

        if (response.success) {
          toast.success(response.message);
          toast.info(
            "Emails sent to user with login credentials and welcome information",
          );
          router.refresh(); // Refresh the page to update the user list
          handleClose(); // Reset and close the dialog
        } else {
          // Check if there are field-specific errors
          if (response.errors) {
            // Handle field-specific errors
            Object.entries(response.errors).forEach(([field, messages]) => {
              if (field in errors && messages && messages.length > 0) {
                setError(field as keyof FormData, {
                  type: "manual",
                  message: messages[0],
                });
              }
            });
          }

          setApiError(response.message || "Failed to create user");
          toast.error(response.message || "Failed to create user");
        }
      } catch (error) {
        console.error("Create user error:", error);
        setApiError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    });
  };

  const handleClose = () => {
    // Reset form to default values
    reset({
      name: "",
      email: "",
      password: "",
      role: "USER" as Role,
      emailVerified: true,
      notification: true,
    });
    setShowPassword(false);
    setApiError(null);
    onCloseAction();
  };
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleGeneratePassword = () => {
    try {
      const newPassword = generatePassword(12, true);
      setValue("password", newPassword, { shouldValidate: true });
      setShowPassword(true); // Show the password when generated

      // Modern clipboard API with fallback
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(newPassword)
          .then(() => {
            toast.success("Password generated and copied to clipboard!");
          })
          .catch(() => {
            // Fallback to older method if clipboard API fails
            copyToClipboardFallback(newPassword);
          });
      } else {
        // Fallback for non-secure contexts or older browsers
        copyToClipboardFallback(newPassword);
      }
    } catch (error) {
      console.error("Error generating password:", error);
      toast.error("Failed to generate password");
    }
  };

  const copyToClipboardFallback = (text: string) => {
    // Create a temporary element to enable copy to clipboard functionality
    const tempInput = document.createElement("input");
    tempInput.style.position = "absolute";
    tempInput.style.left = "-9999px";
    document.body.appendChild(tempInput);
    tempInput.value = text;
    tempInput.select();

    try {
      document.execCommand("copy");
      toast.success("Password generated and copied to clipboard!");
    } catch {
      toast.info("Password generated! Please copy it manually.");
    } finally {
      document.body.removeChild(tempInput);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Add New User
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Create a new user account in the system. The user will receive an
            email with their login credentials
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 sm:space-y-4"
        >
          {apiError && (
            <div className="text-xs sm:text-sm text-destructive">
              {apiError}
            </div>
          )}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
              Name
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="User's full name"
              className="h-8 sm:h-9 text-xs sm:text-sm"
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-[10px] sm:text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="user@example.com"
              className="h-8 sm:h-9 text-xs sm:text-sm"
              disabled={isPending}
            />
            {errors.email && (
              <p className="text-[10px] sm:text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs sm:text-sm font-medium"
              >
                Password
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassword}
                className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                disabled={isPending}
              >
                Generate Password
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="Create a strong password"
                className="h-8 sm:h-9 text-xs sm:text-sm pr-9"
                disabled={isPending}
                aria-describedby="password-requirements"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-3.5 sm:size-4" />
                ) : (
                  <Eye className="size-3.5 sm:size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] sm:text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
            <p
              id="password-requirements"
              className="text-[10px] text-muted-foreground"
            >
              Password must be at least 8 characters with uppercase, lowercase,
              and number. The password will be sent to the user&apos;s email for
              first-time login.
            </p>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium">Role</Label>
            <RadioGroup
              defaultValue="USER"
              className="flex gap-3 sm:gap-4"
              value={watch("role")}
              onValueChange={(value) => setValue("role", value as Role)}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <RadioGroupItem
                  value="USER"
                  id="user-role"
                  disabled={isPending}
                />
                <Label
                  htmlFor="user-role"
                  className="text-xs sm:text-sm font-normal cursor-pointer"
                >
                  User
                </Label>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <RadioGroupItem
                  value="ADMIN"
                  id="admin-role"
                  disabled={isPending}
                />
                <Label
                  htmlFor="admin-role"
                  className="text-xs sm:text-sm font-normal cursor-pointer"
                >
                  Administrator
                </Label>
              </div>
            </RadioGroup>
            {errors.role && (
              <p className="text-[10px] sm:text-xs text-destructive">
                {errors.role.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Checkbox
                id="emailVerified"
                // Remove defaultChecked as it conflicts with controlled component
                checked={watch("emailVerified") === true}
                onCheckedChange={(checked) => {
                  console.log("Email verified checkbox changed to:", checked);
                  setValue("emailVerified", checked === true);
                }}
                disabled={isPending}
              />
              <Label
                htmlFor="emailVerified"
                className="text-xs sm:text-sm font-normal cursor-pointer"
                onClick={() =>
                  setValue("emailVerified", !watch("emailVerified"))
                }
              >
                Mark email as verified
              </Label>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Checkbox
                id="notification"
                // Remove defaultChecked as it conflicts with controlled component
                checked={watch("notification") === true}
                onCheckedChange={(checked) => {
                  console.log("Notification checkbox changed to:", checked);
                  setValue("notification", checked === true);
                }}
                disabled={isPending}
              />
              <Label
                htmlFor="notification"
                className="text-xs sm:text-sm font-normal cursor-pointer"
                onClick={() => setValue("notification", !watch("notification"))}
              >
                Enable email notifications
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col xs:flex-row pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-8 sm:h-9 text-xs sm:text-sm"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-8 sm:h-9 text-xs sm:text-sm"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3 sm:size-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
