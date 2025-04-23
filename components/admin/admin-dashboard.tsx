"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSignature, Users, User, Settings, LayoutDashboard, LogOut, BarChart4, Bell, Calendar, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { logoutUser } from "@/actions/auth";

export function AdminDashboardComponent() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tighter">Welcome to the Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization, documents, and users from this central dashboard.</p>
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
                    <p className="text-sm text-muted-foreground">Manage all organization documents</p>
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
                    <p className="text-sm text-muted-foreground">View and manage user accounts</p>
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
                    <p className="text-sm text-muted-foreground">Your admin account details</p>
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
                    <p className="text-sm text-muted-foreground">Configure admin preferences</p>
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
                    <p className="text-sm text-muted-foreground">Access regular user view</p>
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
                    <p className="text-sm text-muted-foreground">View your user profile</p>
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
                    <p className="text-sm text-muted-foreground">Access user settings</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <form action={logoutUser} className="w-full">
                <Card className="h-full card-hover border-border ho</button>ver:border-destructive/10 cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center gap-4 pt-6 pb-6">
                    <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <LogOut className="size-6 text-destructive" />
                    </div>
                    <div className="space-y-1 text-center">
                      <Button variant="ghost" className="font-medium h-auto p-0">
                        Logout
                      </Button>
                      <p className="text-sm text-muted-foreground">Sign out of your account</p>
                    </div>
                  </CardContent>
                </Card>
            </form>
          </div>
        </div>

        {/* Separator */}
        <Separator className="my-2" />

        {/* Third Row - Additional Features */}
        <div>
          <h2 className="text-xl font-medium mb-4">Analytics & Operations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-hover border-border hover:border-primary/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart4 className="size-5 text-primary" /> Analytics
                </CardTitle>
                <CardDescription>System usage statistics</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[120px] flex items-center justify-center">
                  <div className="flex items-end gap-2 h-[100px]">
                    {[40, 65, 30, 80, 55, 70, 25].map((value, i) => (
                      <div key={i} className="w-6 bg-primary/80 rounded-t-sm" style={{ height: `${value}%` }} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover border-border hover:border-primary/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="size-5 text-primary" /> Notifications
                </CardTitle>
                <CardDescription>Recent system alerts</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="border-l-2 border-primary pl-3 py-1">
                    <p className="font-medium text-sm">System Update</p>
                    <p className="text-xs text-muted-foreground">Scheduled for today at 2:00 PM</p>
                  </div>
                  <div className="border-l-2 border-primary/70 pl-3 py-1">
                    <p className="font-medium text-sm">New User Registration</p>
                    <p className="text-xs text-muted-foreground">5 new users in the last 24h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover border-border hover:border-primary/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="size-5 text-primary" /> Calendar
                </CardTitle>
                <CardDescription>Upcoming events</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">23</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Team Meeting</p>
                      <p className="text-xs text-muted-foreground">Discussion on new features</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">28</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Release v2.4</p>
                      <p className="text-xs text-muted-foreground">Major system update</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover border-border hover:border-primary/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="size-5 text-primary" /> Activity
                </CardTitle>
                <CardDescription>Recent system activity</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-primary rounded-full"></div>
                      <p className="text-sm">Document signed</p>
                    </div>
                    <p className="text-xs text-muted-foreground">10m ago</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-primary rounded-full"></div>
                      <p className="text-sm">New user registered</p>
                    </div>
                    <p className="text-xs text-muted-foreground">1h ago</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-primary rounded-full"></div>
                      <p className="text-sm">Settings updated</p>
                    </div>
                    <p className="text-xs text-muted-foreground">3h ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
