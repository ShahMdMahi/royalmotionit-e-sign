"use client";

import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { Mail, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NameChangeForm } from "./name-change-form";
import { PasswordChangeForm } from "./password-change-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changeNotificationSettings } from "@/actions/user";
import { toast } from "sonner";

interface SettingsComponentProps {
  session: Session;
  notification: boolean;
}

export function SettingsComponent({ session, notification }: SettingsComponentProps) {
  const [emailNotifications, setEmailNotifications] = useState<boolean>(notification);

  const userName = session.user?.name || "User";
  const userEmail = session.user?.email || "";
  const userImage = session.user?.image || "";

  // Helper function to get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  useEffect(() => {
    const updateNotificationSettings = async () => {
      const response = await changeNotificationSettings(emailNotifications);
      if (response.success || response.message) {
        toast.success(response.message || "Notification settings updated successfully.");
      }

      if (!response.success) {
        toast.error(response.message || "Failed to update notification settings.");
      }
    };

    if (session.user.notification !== emailNotifications) {
      updateNotificationSettings();
    }
  }, [emailNotifications, notification]);

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Settings header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
            <p className="text-xs text-muted-foreground">{session.user.id}</p>
          </div>
        </div>
      </div>

      {/* Settings tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <div className="mb-6 overflow-x-auto">
          <TabsList className="mb-8 w-full justify-start">
            <TabsTrigger value="profile" className="gap-2">
              <User className="size-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Mail className="size-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab - Name and Password Change */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 gap-8">
            <Alert>
              <AlertDescription className="text-sm">Update your profile information and password</AlertDescription>
            </Alert>

            {/* Name Change Form */}
            <Card className="overflow-hidden shadow-lg rounded-lg card-hover border-border">
              <CardHeader className="p-6 border-b border-border">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="size-4 text-primary" />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription>Update your name</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <NameChangeForm />
              </CardContent>
            </Card>

            {/* Password Change Form */}
            <PasswordChangeForm />
          </div>
        </TabsContent>

        {/* Notifications Tab - Email Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 gap-8">
            <Alert>
              <AlertDescription className="text-sm">Control email notification settings</AlertDescription>
            </Alert>

            <Card className="overflow-hidden shadow-lg rounded-lg card-hover border-border">
              <CardHeader className="p-6 border-b border-border">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="size-4 text-primary" />
                  </div>
                  Email Notifications
                </CardTitle>
                <CardDescription>Manage email notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notif">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications about activity via email</p>
                    </div>
                    <Switch id="email-notif" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
