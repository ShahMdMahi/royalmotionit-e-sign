"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, User, Settings, LogOut } from "lucide-react";
import { logoutUser } from "@/actions/auth";

export function DashboardComponent() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tighter">Welcome to Your Dashboard</h1>
          <p className="text-muted-foreground">Manage and track all your documents and signature requests.</p>
        </div>

        {/* First Row - Main User Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/documents" className="w-full">
            <Card className="h-full card-hover border-border hover:border-primary/50">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="size-6 text-primary" />
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="text-lg font-medium">My Documents</h3>
                  <p className="text-sm text-muted-foreground">Access and manage your documents</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile" className="w-full">
            <Card className="h-full card-hover border-border hover:border-primary/50">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="size-6 text-primary" />
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="text-lg font-medium">My Profile</h3>
                  <p className="text-sm text-muted-foreground">View and update your account details</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings" className="w-full">
            <Card className="h-full card-hover border-border hover:border-primary/50">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="size-6 text-primary" />
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="text-lg font-medium">My Settings</h3>
                  <p className="text-sm text-muted-foreground">Customize your preferences</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <form action={logoutUser} className="w-full">
            <Card className="h-full card-hover border-border hover:border-destructive/10 cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <LogOut className="size-6 text-destructive" />
                </div>
                <div className="space-y-1 text-center">
                  <Button type="submit" variant="ghost" className="font-medium h-auto p-0">
                    Logout
                  </Button>
                  <p className="text-sm text-muted-foreground">Sign out from your account</p>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
