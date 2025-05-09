"use client";

import { useState, useEffect } from "react";
import { User, Globe, ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { PasswordChangeForm } from "../common/password-change-form";
import { NameChangeForm } from "../common/name-change-form";
import { updateIsRegistrationActive, updateIsGoogleAuthActive, getIsRegistrationActive, getIsGoogleAuthActive } from "@/actions/edge-config";

export function AdminSettingsComponent() {
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegistrationUpdating, setIsRegistrationUpdating] = useState<boolean>(false);
  const [isGoogleAuthUpdating, setIsGoogleAuthUpdating] = useState<boolean>(false);

  // Fetch registration and Google auth status with retry logic
  useEffect(() => {
    const fetchSettings = async (retryCount = 0, maxRetries = 3) => {
      setIsLoading(true);
      try {
        const registrationStatus = await getIsRegistrationActive();
        const googleAuthStatus = await getIsGoogleAuthActive();

        setRegistrationEnabled(registrationStatus);
        setGoogleAuthEnabled(googleAuthStatus);
      } catch (error) {
        console.error("Error fetching settings:", error);

        if (retryCount < maxRetries) {
          // Wait for exponential backoff time before retrying (1s, 2s, 4s)
          const backoffTime = Math.pow(2, retryCount) * 1000;
          toast.error(`Failed to load settings. Retrying in ${backoffTime / 1000}s...`);

          setTimeout(() => {
            fetchSettings(retryCount + 1, maxRetries);
          }, backoffTime);
        } else {
          toast.error("Failed to load settings after multiple attempts. Please refresh the page.");
        }
      } finally {
        if (retryCount === 0 || retryCount === maxRetries) {
          setIsLoading(false);
        }
      }
    };

    fetchSettings();
  }, []);

  // Handle registration settings update with API call
  const updateRegistrationSettings = async (newStatus: boolean) => {
    setIsRegistrationUpdating(true);
    try {
      const response = await updateIsRegistrationActive(newStatus);
      if (response.success) {
        toast.success(response.message || "Registration settings updated successfully.");
      } else {
        toast.error(response.error || "Failed to update registration settings.");
        // Revert the state if API call failed
        setRegistrationEnabled(!newStatus);
      }
    } catch (error) {
      console.error("Error updating registration settings:", error);
      toast.error("An unexpected error occurred.");
      // Revert the state if API call failed
      setRegistrationEnabled(!newStatus);
    } finally {
      setIsRegistrationUpdating(false);
    }
  };

  // Handle Google auth settings update with API call
  const updateGoogleAuthSettings = async (newStatus: boolean) => {
    setIsGoogleAuthUpdating(true);
    try {
      const response = await updateIsGoogleAuthActive(newStatus);
      if (response.success) {
        toast.success(response.message || "Google authentication settings updated successfully.");
      } else {
        toast.error(response.error || "Failed to update Google authentication settings.");
        // Revert the state if API call failed
        setGoogleAuthEnabled(!newStatus);
      }
    } catch (error) {
      console.error("Error updating Google auth settings:", error);
      toast.error("An unexpected error occurred.");
      // Revert the state if API call failed
      setGoogleAuthEnabled(!newStatus);
    } finally {
      setIsGoogleAuthUpdating(false);
    }
  };

  const handleRegistrationToggle = async () => {
    const newStatus = !registrationEnabled;
    setRegistrationEnabled(newStatus); // Optimistically update UI
    updateRegistrationSettings(newStatus); // Make API call
  };

  const handleGoogleAuthToggle = async () => {
    const newStatus = !googleAuthEnabled;
    setGoogleAuthEnabled(newStatus); // Optimistically update UI
    updateGoogleAuthSettings(newStatus); // Make API call
  };

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-10 max-w-7xl">
      {/* Settings header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tighter">Admin Settings</h1>
          <p className="text-muted-foreground">Manage admin account settings and website configurations</p>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
          <ShieldCheck className="size-5 text-primary" />
          <span className="font-medium text-primary">Admin Controls</span>
        </div>
      </div>

      {/* Settings tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <div className="mb-8 border-b border-border/80 overflow-x-auto">
          <TabsList className="w-full md:w-auto justify-start bg-transparent h-12">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <User className="size-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="website" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Globe className="size-4" />
              <span>Website</span>
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
                <CardDescription className="text-base">Update your profile</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <NameChangeForm />
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">You can update your name and profile information here. Changes will be reflected across the platform.</p>
                  <div className="flex justify-end">
                    <div className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 cursor-pointer">Update Profile</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Change Form */}
            <Card className="overflow-hidden shadow-lg rounded-xl border-border transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <CardHeader className="p-6 border-b border-border bg-muted/10">
                <CardTitle className="text-xl font-semibold flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="size-5 text-primary" />
                  </div>
                  Security
                </CardTitle>
                <CardDescription className="text-base">Update your security</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <PasswordChangeForm />
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">You can update your password here. Make sure to use a strong, unique password.</p>
                  <div className="flex justify-end">
                    <div className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 cursor-pointer">Change Password</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Website Tab - Registration and Google Auth Controls */}
        <TabsContent value="website" className="space-y-8">
          <Alert className="bg-primary/5 border-primary/20">
            <AlertDescription className="text-sm text-foreground">Control website registration and authentication settings</AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-8">
            <Card className="overflow-hidden shadow-lg rounded-xl border-border transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <CardHeader className="p-6 border-b border-border bg-muted/10">
                <CardTitle className="text-xl font-semibold flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="size-5 text-primary" />
                  </div>
                  Website Settings
                </CardTitle>
                <CardDescription className="text-base">Manage registration and authentication options</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="py-4 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="registration" className="text-base font-medium">
                            Website Registration
                          </Label>
                          <p className="text-sm text-muted-foreground">Allow users to register new accounts on the website</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isRegistrationUpdating && <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>}
                          <Switch
                            id="registration"
                            checked={registrationEnabled}
                            onCheckedChange={handleRegistrationToggle}
                            className="data-[state=checked]:bg-primary"
                            disabled={isRegistrationUpdating}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="google-auth" className="text-base font-medium">
                            Google Authentication
                          </Label>
                          <p className="text-sm text-muted-foreground">Allow users to sign in with Google accounts</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGoogleAuthUpdating && <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>}
                          <Switch id="google-auth" checked={googleAuthEnabled} onCheckedChange={handleGoogleAuthToggle} className="data-[state=checked]:bg-primary" disabled={isGoogleAuthUpdating} />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/50">
                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertDescription className="text-sm text-amber-800">
                            <strong>Note:</strong> Changes to these settings will impact all users of the platform. Please ensure you understand the consequences before making changes.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
