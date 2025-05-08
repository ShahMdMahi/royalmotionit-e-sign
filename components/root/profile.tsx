import { User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NameChangeForm } from "./name-change-form";
import { PasswordChangeForm } from "./password-change-form";
import { Session } from "next-auth";
import { User as UserIcon, Calendar, Mail, Hash } from "lucide-react";

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

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Profile header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your profile details</p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "U"} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(user.name ?? "U")}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">{user.id}</p>
          </div>
        </div>
      </div>

      {/* Profile Details Card */}
      <Card className="overflow-hidden shadow-lg rounded-lg card-hover border-border">
        <CardHeader className="p-6 border-b border-border">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="size-4 text-primary" />
            </div>
            Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
            <Avatar className="w-28 h-28 border-2 border-primary rounded-full shadow-md">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="text-xl font-bold text-primary bg-primary/10">{getInitials(user.name ?? "U")}</AvatarFallback>
            </Avatar>
            <div className="grid gap-4 flex-1">
              <div className="flex items-center gap-2 text-lg">
                <UserIcon className="size-5 text-primary" />
                <span className="font-medium">Name:</span>
                <span className="text-muted-foreground">{user.name ?? "No name provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Mail className="size-5 text-primary" />
                <span className="font-medium">Email:</span>
                <span className="text-muted-foreground">{user.email ?? "No email provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Hash className="size-5 text-primary" />
                <span className="font-medium">ID:</span>
                <span className="text-muted-foreground">{user.id ?? "No ID provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Calendar className="size-5 text-primary" />
                <span className="font-medium">Created At:</span>
                <span className="text-muted-foreground">{user.createdAt?.toLocaleDateString() ?? "No date provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Calendar className="size-5 text-primary" />
                <span className="font-medium">Updated At:</span>
                <span className="text-muted-foreground">{user.updatedAt?.toLocaleDateString() ?? "No date provided"}</span>
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
