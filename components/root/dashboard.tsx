"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, User, Settings, LogOut } from "lucide-react";
import { logoutUser } from "@/actions/auth";

export function DashboardComponent() {
  return (
    <div className="container py-6 sm:py-8 md:py-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col gap-6 md:gap-10">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter md:text-4xl">
            Welcome to Your Dashboard
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Manage and track all your documents and signature requests.
          </p>
        </div>

        {/* Main User Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link href="/documents" className="w-full group">
            <Card className="h-full border-border shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/50 group-hover:-translate-y-1">
              <CardContent className="flex flex-col items-center justify-center gap-3 sm:gap-5 p-4 sm:p-6">
                <div className="size-12 sm:size-14 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                  <FileText className="size-6 sm:size-7 text-primary" />
                </div>
                <div className="space-y-1 sm:space-y-2 text-center">
                  <h3 className="text-lg sm:text-xl font-medium">
                    My Documents
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Access and manage your documents
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile" className="w-full group">
            <Card className="h-full border-border shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/50 group-hover:-translate-y-1">
              <CardContent className="flex flex-col items-center justify-center gap-3 sm:gap-5 p-4 sm:p-6">
                <div className="size-12 sm:size-14 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                  <User className="size-6 sm:size-7 text-primary" />
                </div>
                <div className="space-y-1 sm:space-y-2 text-center">
                  <h3 className="text-lg sm:text-xl font-medium">My Profile</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    View and update your account details
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings" className="w-full group">
            <Card className="h-full border-border shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/50 group-hover:-translate-y-1">
              <CardContent className="flex flex-col items-center justify-center gap-3 sm:gap-5 p-4 sm:p-6">
                <div className="size-12 sm:size-14 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Settings className="size-6 sm:size-7 text-primary" />
                </div>
                <div className="space-y-1 sm:space-y-2 text-center">
                  <h3 className="text-lg sm:text-xl font-medium">
                    My Settings
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Customize your preferences
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <form action={logoutUser} className="w-full group">
            <Card className="h-full border-border cursor-pointer shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:border-destructive/50 group-hover:-translate-y-1">
              <CardContent className="flex flex-col items-center justify-center gap-3 sm:gap-5 p-4 sm:p-6">
                <div className="size-12 sm:size-14 rounded-full bg-destructive/10 flex items-center justify-center transition-transform group-hover:scale-110">
                  <LogOut className="size-6 sm:size-7 text-destructive" />
                </div>
                <div className="space-y-1 sm:space-y-2 text-center">
                  <Button
                    type="submit"
                    variant="ghost"
                    className="text-lg sm:text-xl font-medium h-auto p-0 hover:text-destructive"
                  >
                    Logout
                  </Button>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Sign out from your account
                  </p>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
