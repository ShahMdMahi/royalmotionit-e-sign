"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUser } from "@/actions/user";
import { User, Role } from "@prisma/client";
import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UpdateUserSchema } from "@/schema";
import { z } from "zod";

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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof UpdateUserSchema>;

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onCloseAction: () => void;
}

export function EditUserDialog({
  user,
  isOpen,
  onCloseAction,
}: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "USER" as Role,
    },
  });

  // Set form values when user changes
  useEffect(() => {
    if (user) {
      setValue("name", user.name || "");
      setValue("email", user.email || "");
      setValue("role", user.role || "USER");
    }
  }, [user, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    startTransition(async () => {
      try {
        // Convert form data to FormData object
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("role", data.role);

        // Handle optional boolean fields
        if (data.emailVerified) {
          formData.append("emailVerified", "on");
        }
        if (data.notification) {
          formData.append("notification", "on");
        }

        const response = await updateUser(
          user.id,
          { success: false },
          formData,
        );

        if (response.success) {
          toast.success(response.message);
          router.refresh(); // Refresh the page to update the user list
          onCloseAction();
        } else {
          setError(response.message || "Failed to update user");
          toast.error(response.message || "Failed to update user");
        }
      } catch (err) {
        console.error("Error updating user:", err);
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  // Reset form and error state when dialog closes
  const handleClose = () => {
    reset();
    setError(null);
    onCloseAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit User</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the user&apos;s details and permissions
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="User's full name"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup
              defaultValue={user?.role || "USER"}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="USER" id="user" {...register("role")} />
                <Label htmlFor="user" className="cursor-pointer text-sm">
                  User
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="ADMIN"
                  id="admin"
                  {...register("role")}
                />
                <Label htmlFor="admin" className="cursor-pointer text-sm">
                  Admin
                </Label>
              </div>
            </RadioGroup>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>{" "}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="emailVerified"
              defaultChecked={!!user?.emailVerified}
              {...register("emailVerified")}
            />
            <Label
              htmlFor="emailVerified"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Email verified
            </Label>
            <div className="ml-2 text-xs text-muted-foreground">
              {user?.emailVerified
                ? `(Verified on ${new Date(user.emailVerified).toLocaleDateString()})`
                : "(Not verified yet)"}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notification"
              defaultChecked={user?.notification ?? true}
              {...register("notification")}
            />
            <Label
              htmlFor="notification"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Enable notifications
            </Label>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
