"use client";

import { useState } from "react";
import { Session } from "next-auth";
import { Mail, User, Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NameChangeForm } from "../common/name-change-form";
import { PasswordChangeForm } from "../common/password-change-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changeNotificationSettings } from "@/actions/user";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";

interface SettingsComponentProps {
  session: Session;
  notification: boolean;
}

export function SettingsComponent({ session, notification }: SettingsComponentProps) {
  const [emailNotifications, setEmailNotifications] = useState<boolean>(notification);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const userName = session.user?.name || "User";
  const userEmail = session.user?.email || "";
  const userImage = session.user?.image || "";

  // Handle notification setting changes
  const handleNotificationChange = async (newStatus: boolean) => {
    if (isUpdating) return;

    setIsUpdating(true);
    setEmailNotifications(newStatus); // Optimistically update UI

    try {
      const response = await changeNotificationSettings(newStatus);

      if (response.success) {
        toast.success(response.message || "Notification settings updated successfully.");
      } else {
        // Revert state if request failed
        setEmailNotifications(!newStatus);
        toast.error(response.message || "Failed to update notification settings.");
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      // Revert state if request failed
      setEmailNotifications(!newStatus);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-10 max-w-7xl">
      {/* Settings header */}
      <PageHeader
        title="Account Settings"
        description="Manage your account settings and preferences"
        showUserInfo={true}
        userName={userName}
        userEmail={userEmail}
        userId={session.user.id}
        userImage={userImage}
        icon={
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="size-6 text-primary" />
          </div>
        }
      />

      {/* Settings tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <div className="mb-8 border-b border-border/80 overflow-x-auto">
          <TabsList className="w-full md:w-auto justify-start bg-transparent h-12">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <User className="size-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Mail className="size-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab - Name and Password Change */}
        <TabsContent value="profile" className="space-y-8">
          <Alert className="bg-primary/5 border-primary/20">
            <AlertDescription className="text-sm text-foreground">Update your profile information and password</AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-8">
            {/* Name Change Form */}
            <Card className="overflow-hidden shadow-lg rounded-xl border-border transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <CardHeader className="p-6 border-b border-border bg-muted/10">
                <CardTitle className="text-xl font-semibold flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="size-5 text-primary" />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription className="text-base">Update your name</CardDescription>
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
        <TabsContent value="notifications" className="space-y-8">
          <Alert className="bg-primary/5 border-primary/20">
            <AlertDescription className="text-sm text-foreground">Control email notification settings</AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-8">
            <Card className="overflow-hidden shadow-lg rounded-xl border-border transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <CardHeader className="p-6 border-b border-border bg-muted/10">
                <CardTitle className="text-xl font-semibold flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="size-5 text-primary" />
                  </div>
                  Email Notifications
                </CardTitle>
                <CardDescription className="text-base">Manage email notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border shadow-sm">
                    <div className="space-y-1">
                      <Label htmlFor="email-notif" className="text-lg font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive notifications about document activities via email</p>
                    </div>
                    <Switch id="email-notif" checked={emailNotifications} onCheckedChange={handleNotificationChange} disabled={isUpdating} className="scale-125 data-[state=checked]:bg-primary" />
                    {isUpdating && <span className="ml-2 text-xs text-muted-foreground animate-pulse">Updating...</span>}
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
