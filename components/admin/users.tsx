"use client";

import { User } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, Edit, Mail, Search, Trash2, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  deleteUser,
  sendVerificationEmail,
  verifyUserDirectly,
} from "@/actions/user";
import { useRouter } from "next/navigation";
import { EditUserDialog } from "./edit-user-dialog";
import { AddUserDialog } from "./add-user-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function UsersComponent({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name?.toLowerCase() || "").includes(searchLower) ||
      (user.email?.toLowerCase() || "").includes(searchLower) ||
      (user.id?.toLowerCase() || "").includes(searchLower) ||
      (user.role?.toLowerCase() || "").includes(searchLower)
    );
  });

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      const response = await deleteUser(userToDelete.id);

      if (response.success) {
        toast.success(response.message);
        router.refresh(); // Refresh the current page to update the user list
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Delete user error:", error);
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  // Handle direct email verification
  const handleVerifyUser = async (userId: string) => {
    try {
      setIsVerifying(userId);
      const response = await verifyUserDirectly(userId);

      if (response.success) {
        toast.success(response.message);
        router.refresh(); // Refresh the current page to update the user list
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Email verification error:", error);
    } finally {
      setIsVerifying(null);
    }
  };

  // Handle sending verification email
  const handleSendVerificationEmail = async (userId: string) => {
    try {
      setIsSendingVerification(userId);
      const response = await sendVerificationEmail(userId);

      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Send verification email error:", error);
    } finally {
      setIsSendingVerification(null);
    }
  };
  // Calculate user stats
  const totalUsers = users.length;
  const adminUsers = users.filter(
    (user) => user.role?.toLowerCase() === "admin",
  ).length;
  const regularUsers = users.filter(
    (user) => user.role?.toLowerCase() === "user",
  ).length;

  return (
    <div className="container py-4 sm:py-8 px-2 sm:px-4 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold tracking-tighter">
              User Management
            </h1>
            <p className="text-xs xs:text-sm text-muted-foreground">
              View and manage all users in the system.
            </p>
          </div>
          <Button
            className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-10 text-xs sm:text-sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Users className="size-3.5 sm:size-4" />
            <span>Add New User</span>
          </Button>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="card-hover border-border">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="flex items-center justify-between">
                <div className="text-lg xs:text-xl sm:text-2xl font-bold">
                  {totalUsers}
                </div>
                <div className="size-6 sm:size-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="size-3 sm:size-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="flex items-center justify-between">
                <div className="text-lg xs:text-xl sm:text-2xl font-bold">
                  {adminUsers}
                </div>
                <div className="size-6 sm:size-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users className="size-3 sm:size-4 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Regular Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="flex items-center justify-between">
                <div className="text-lg xs:text-xl sm:text-2xl font-bold">
                  {regularUsers}
                </div>
                <div className="size-6 sm:size-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Users className="size-3 sm:size-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table Card */}
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
              <Users className="size-4 sm:size-5 text-primary" /> All Users
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-2 sm:pt-3">
            {/* Search input */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, email, ID or role..."
                  className="pl-8 sm:pl-9 h-8 sm:h-10 text-xs sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-1.5 h-8 sm:h-10 text-xs sm:text-sm"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Users className="size-3.5 sm:size-4" />
                <span>Add User</span>
              </Button>
            </div>
            {filteredUsers.length > 0 ? (
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] sm:w-[100px] text-xs sm:text-sm py-2 sm:py-3">
                        ID
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Name
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Email
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Role
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3">
                        Verification
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm py-2 sm:py-3 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-xs sm:text-sm py-2.5 sm:py-3">
                          {user.id}
                        </TableCell>
                        <TableCell className="py-2.5 sm:py-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div
                              className={`size-1.5 sm:size-2 rounded-full ${
                                user.emailVerified
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                              }`}
                            ></div>
                            <span className="text-xs sm:text-sm">
                              {user.name || "No name"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-2.5 sm:py-3">
                          {user.email}
                        </TableCell>
                        <TableCell className="py-2.5 sm:py-3">
                          {user.role?.toLowerCase() === "admin" ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 capitalize text-[10px] xs:text-xs h-5 sm:h-6"
                            >
                              Admin
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-slate-100 text-slate-700 border-slate-200 capitalize text-[10px] xs:text-xs h-5 sm:h-6"
                            >
                              User
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 sm:py-3">
                          <div className="flex gap-1">
                            {user.emailVerified ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] xs:text-xs h-5 sm:h-6 inline-flex items-center"
                              >
                                <CheckCircle className="size-3 mr-1" /> Verified
                              </Badge>
                            ) : (
                              <TooltipProvider>
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 rounded-md bg-blue-50 border-blue-200 text-blue-700 text-[10px] xs:text-xs px-1.5"
                                        onClick={() =>
                                          handleVerifyUser(user.id)
                                        }
                                        disabled={isVerifying === user.id}
                                      >
                                        {isVerifying === user.id ? (
                                          <div className="flex items-center">
                                            <div className="size-3 mr-1 border-t-2 border-blue-700 rounded-full animate-spin"></div>
                                            Verifying...
                                          </div>
                                        ) : (
                                          <>
                                            <CheckCircle className="size-3 mr-1" />
                                            Verify
                                          </>
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Directly verify this user&apos;s email
                                        address
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 rounded-md bg-slate-50 border-slate-200 text-slate-700 text-[10px] xs:text-xs px-1.5"
                                        onClick={() =>
                                          handleSendVerificationEmail(user.id)
                                        }
                                        disabled={
                                          isSendingVerification === user.id
                                        }
                                      >
                                        {isSendingVerification === user.id ? (
                                          <div className="flex items-center">
                                            <div className="size-3 mr-1 border-t-2 border-slate-700 rounded-full animate-spin"></div>
                                            Sending...
                                          </div>
                                        ) : (
                                          <>
                                            <Mail className="size-3 mr-1" />
                                            Email
                                          </>
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Send verification email to user
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2.5 sm:py-3">
                          <div className="flex justify-end gap-0.5 sm:gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => {
                                setUserToEdit(user);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="size-3.5 sm:size-4" />
                              <span className="sr-only">Edit user</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={`size-7 sm:size-8 ${
                                user.id === currentUserId
                                  ? "opacity-40 cursor-not-allowed"
                                  : "text-destructive hover:bg-destructive/10"
                              }`}
                              onClick={() => setUserToDelete(user)}
                              disabled={user.id === currentUserId}
                              title={
                                user.id === currentUserId
                                  ? "Cannot delete your own account"
                                  : "Delete user"
                              }
                            >
                              <Trash2 className="size-3.5 sm:size-4" />
                              <span className="sr-only">Delete user</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6 sm:p-8 text-xs sm:text-sm text-muted-foreground border rounded-md">
                {searchTerm
                  ? "No users found matching your search"
                  : "No users found"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete User Dialog */}
        <AlertDialog
          open={!!userToDelete}
          onOpenChange={(open) => !open && setUserToDelete(null)}
        >
          <AlertDialogContent className="max-w-[90vw] w-full sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                {userToDelete && (
                  <>
                    Are you sure you want to delete{" "}
                    <strong>{userToDelete.name || userToDelete.email}</strong>?
                    This action cannot be undone and will permanently remove the
                    user and all associated data.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0 flex-col xs:flex-row">
              <AlertDialogCancel
                onClick={() => setUserToDelete(null)}
                className="h-8 sm:h-9 text-xs sm:text-sm mt-0"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive hover:bg-destructive/90 h-8 sm:h-9 text-xs sm:text-sm"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit User Dialog */}
        <EditUserDialog
          user={userToEdit}
          isOpen={isEditDialogOpen}
          onCloseAction={() => {
            setIsEditDialogOpen(false);
            setUserToEdit(null);
          }}
        />

        {/* Add User Dialog */}
        <AddUserDialog
          isOpen={isAddDialogOpen}
          onCloseAction={() => setIsAddDialogOpen(false)}
        />
      </div>
    </div>
  );
}
