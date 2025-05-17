"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileSignature,
  Users,
  User,
  Settings,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { logoutUser } from "@/actions/auth";

export function AdminDashboardComponent() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tighter">
            Welcome to the Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your organization, documents, and users from this central
            dashboard.
          </p>
        </div>

        {/* First Row - Main Admin Features */}
        <div>
          <h2 className="text-xl font-medium mb-4">Administration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/documents" className="w-full">
              <Card className="h-full card-hover border-border hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileSignature className="size-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-medium">Documents</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage all organization documents
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users" className="w-full">
              <Card className="h-full card-hover border-border hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="size-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-medium">Users</h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage user accounts
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/profile" className="w-full">
              <Card className="h-full card-hover border-border hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="size-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-medium">Admin Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Your admin account details
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/settings" className="w-full">
              <Card className="h-full card-hover border-border hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="size-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-medium">Admin Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure admin preferences
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Separator */}
        <Separator className="my-2" />

        {/* Second Row - User Dashboard Links */}
        <div>
          <h2 className="text-xl font-medium mb-4">User Dashboard Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard" className="w-full">
              <Card className="h-full card-hover border-border hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                  <div className="size-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <LayoutDashboard className="size-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-medium">User Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Access regular user view
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile" className="w-full">
              <Card className="h-full card-hover border-border hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                  <div className="size-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <User className="size-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-medium">User Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      View your user profile
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings" className="w-full">
              <Card className="h-full card-hover border-border hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                  <div className="size-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Settings className="size-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-medium">User Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Access user settings
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <form action={logoutUser} className="w-full">
              <Card className="h-full card-hover border-border hover:border-destructive/50 cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                  <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <LogOut className="size-6 text-destructive" />
                  </div>
                  <div className="space-y-1 text-center">
                    <Button variant="ghost" className="font-medium h-auto p-0">
                      Logout
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account
                    </p>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>

        {/* Separator */}
        <Separator className="my-2" />
      </div>
    </div>
  );
}
