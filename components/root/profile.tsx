import { User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NameChangeForm } from "../common/name-change-form";
import { PasswordChangeForm } from "../common/password-change-form";
import { Session } from "next-auth";
import { User as UserIcon, Calendar, Hash, GanttChart } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";

interface ProfileComponentProps {
  user: User;
  session: Session;
}

export function ProfileComponent({ user, session }: ProfileComponentProps) {
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
      <PageHeader
        title="My Profile"
        description="Manage your personal profile details"
        showUserInfo={true}
        userName={user.name ?? "User"}
        userEmail={user.email ?? ""}
        userId={user.id}
        userImage={user.image}
        icon={
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="size-6 text-primary" />
          </div>
        }
      />

      {/* Profile Details Card */}
      <Card className="overflow-hidden shadow-lg rounded-xl border-border transition-all duration-300 hover:shadow-xl">
        <CardHeader className="p-6 border-b border-border bg-muted/10">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="size-5 text-primary" />
            </div>
            Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-36 h-36 border-2 border-primary shadow-md">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? "User"}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl font-bold text-primary bg-primary/10">
                  {getInitials(user.name ?? "U")}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {user.name || "No name provided"}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex-1 grid gap-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-card/50 rounded-lg border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="size-4 text-primary" />
                    </div>
                    <span className="font-medium text-lg">
                      Personal Details
                    </span>
                  </div>
                  <div className="space-y-3 pl-11">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {user.name ?? "No name provided"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">
                        {user.email ?? "No email provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-card/50 rounded-lg border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <GanttChart className="size-4 text-primary" />
                    </div>
                    <span className="font-medium text-lg">Account Status</span>
                  </div>
                  <div className="space-y-3 pl-11">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Email Verified
                      </p>
                      <p className="font-medium">
                        {user.emailVerified ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Account Type
                      </p>
                      <p className="font-medium">
                        {session.user.isOauth
                          ? "Social Login"
                          : "Email & Password"}
                      </p>
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
                    <p className="text-sm text-muted-foreground">
                      Account Created
                    </p>
                    <p className="font-medium">
                      {user.createdAt ? formatDate(user.createdAt) : "Unknown"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="font-medium">
                      {user.updatedAt ? formatDate(user.updatedAt) : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/10 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash className="size-4 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-medium text-sm break-all">{user.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!session.user.isOauth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NameChangeForm />
          <PasswordChangeForm />
        </div>
      )}
    </div>
  );
}
