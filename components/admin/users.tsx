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
import { Edit, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
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
import { deleteUser } from "@/actions/user";
import { useRouter } from "next/navigation";

export function UsersComponent({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
  // Calculate user stats
  const totalUsers = users.length;
  const adminUsers = users.filter(
    (user) => user.role?.toLowerCase() === "admin",
  ).length;
  const regularUsers = users.filter(
    (user) => user.role?.toLowerCase() === "user",
  ).length;

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tighter">
              User Management
            </h1>
            <p className="text-muted-foreground">
              View and manage all users in the system.
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => toast.info("Add user functionality coming soon!")}
          >
            <Users className="size-4" />
            <span>Add New User</span>
          </Button>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="card-hover border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{totalUsers}</div>
                <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="size-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{adminUsers}</div>
                <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users className="size-4 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Regular Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{regularUsers}</div>
                <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Users className="size-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="size-5 text-primary" /> All Users
            </CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>{" "}
          <CardContent>
            {/* Search input */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, email, ID or role..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() =>
                  toast.info("Add user functionality coming soon!")
                }
              >
                <Users className="size-4" />
                <span>Add User</span>
              </Button>
            </div>
            {filteredUsers.length > 0 ? (
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`size-2 rounded-full ${user.emailVerified ? "bg-emerald-500" : "bg-slate-300"}`}
                            ></div>
                            {user.name || "No name"}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.role?.toLowerCase() === "admin" ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 capitalize"
                            >
                              Admin
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-slate-100 text-slate-700 border-slate-200 capitalize"
                            >
                              User
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/admin/users/${user.id}`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit user</span>
                              </Button>
                            </Link>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={`${user.id === currentUserId ? "opacity-40 cursor-not-allowed" : "text-destructive hover:bg-destructive/10"}`}
                              onClick={() => setUserToDelete(user)}
                              disabled={user.id === currentUserId}
                              title={
                                user.id === currentUserId
                                  ? "Cannot delete your own account"
                                  : "Delete user"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
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
              <div className="flex items-center justify-center p-8 text-muted-foreground border rounded-md">
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                {userToDelete && (
                  <>
                    Are you sure you want to delete{" "}
                    {userToDelete.name || userToDelete.email}? This action
                    cannot be undone and will permanently remove the user and
                    all associated data.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
