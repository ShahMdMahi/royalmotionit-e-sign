"use client";

import { User } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Search, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export function UsersComponent({ users }: { users: User[] }) {
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tighter">User Management</h1>
          <p className="text-muted-foreground">View and manage all users in the system.</p>
        </div>

        {/* Users Table Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="size-5 text-primary" /> All Users
            </CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search input */}
            <div className="mb-6 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search by name, email, ID or role..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
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
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.role?.toLowerCase()}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit user</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground border rounded-md">{searchTerm ? "No users found matching your search" : "No users found"}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
