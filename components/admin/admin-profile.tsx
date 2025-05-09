"use client";

import { Session } from "next-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Hash, UserIcon, Shield } from "lucide-react";
import Link from "next/link";

interface AdminProfileComponentProps {
  session: Session;
}

export function AdminProfileComponent({ session }: AdminProfileComponentProps) {
  const userData = session.user;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date in a user-friendly way
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-10 max-w-7xl">
      {/* Profile header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tighter">Admin Profile</h1>
          <p className="text-muted-foreground">Manage your admin profile and view advanced details</p>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
          <Shield className="size-5 text-primary" />
          <span className="font-medium text-primary">Administrator Access</span>
        </div>
      </div>

      {/* Profile Details Card */}
      <Card className="overflow-hidden shadow-lg rounded-xl border-border transition-all duration-300 hover:shadow-xl">
        <CardHeader className="p-6 border-b border-border bg-muted/10">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="size-5 text-primary" />
            </div>
            Admin Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-36 h-36 border-2 border-primary shadow-md">
                <AvatarImage src={userData.image ?? undefined} alt={userData.name ?? "User"} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold text-primary bg-primary/10">{getInitials(userData.name ?? "A")}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">{userData.name || "No name provided"}</h2>
                <p className="text-sm text-muted-foreground">{userData.email}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Administrator</div>
              </div>
            </div>

            <div className="flex-1 grid gap-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-card/50 rounded-lg border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="size-4 text-primary" />
                    </div>
                    <span className="font-medium text-lg">Account Information</span>
                  </div>
                  <div className="space-y-3 pl-11">
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-medium truncate">{userData.id}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{userData.email}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium capitalize">{userData.role?.toLowerCase() || "Admin"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-card/50 rounded-lg border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="size-4 text-primary" />
                    </div>
                    <span className="font-medium text-lg">Admin Privileges</span>
                  </div>
                  <div className="space-y-3 pl-11">
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <span className="text-muted-foreground">Access Level:</span>
                      <span className="font-medium">Full Access</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <span className="text-muted-foreground">Permissions:</span>
                      <span className="font-medium">All Permissions</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="inline-flex items-center font-medium text-emerald-600">
                        <span className="size-2 bg-emerald-600 rounded-full mr-2"></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-card/50 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="size-4 text-primary" />
                  </div>
                  <span className="font-medium text-lg">Important Dates</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Account Created</p>
                    <p className="font-medium">{userData.createdAt ? formatDate(userData.createdAt) : "Not available"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{userData.updatedAt ? formatDate(userData.updatedAt) : "Not available"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-medium">Today at 10:45 AM</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Admin Since</p>
                    <p className="font-medium">{userData.createdAt ? formatDate(userData.createdAt) : "Not available"}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/10 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash className="size-4 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">User Identifier</p>
                    <p className="text-sm text-muted-foreground break-all">{userData.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Activity Summary */}
      {/* <Card className="overflow-hidden shadow-lg rounded-xl border-border transition-all duration-300 hover:shadow-xl">
        <CardHeader className="p-6 border-b border-border bg-muted/10">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings className="size-5 text-primary" />
            </div>
            Admin Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-card/50 rounded-lg border border-border shadow-sm">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="size-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold">42</h3>
                <p className="text-muted-foreground text-sm">Total Users Managed</p>
              </div>
            </div>
            <div className="p-4 bg-card/50 rounded-lg border border-border shadow-sm">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <FileSignature className="size-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold">128</h3>
                <p className="text-muted-foreground text-sm">Documents Processed</p>
              </div>
            </div>
            <div className="p-4 bg-card/50 rounded-lg border border-border shadow-sm">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Settings className="size-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold">15</h3>
                <p className="text-muted-foreground text-sm">System Updates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {!userData.isOauth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="overflow-hidden shadow-lg rounded-xl border-border">
            <CardHeader className="p-6 border-b border-border bg-muted/10">
              <CardTitle className="text-lg font-medium">Change Name</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">You can change your name using the profile settings</p>
              <div className="flex justify-end">
                <Link href="/admin/settings" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
                  Go to Settings
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-lg rounded-xl border-border">
            <CardHeader className="p-6 border-b border-border bg-muted/10">
              <CardTitle className="text-lg font-medium">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">You can change your password using the profile settings</p>
              <div className="flex justify-end">
                <Link href="/admin/settings" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
                  Go to Settings
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
