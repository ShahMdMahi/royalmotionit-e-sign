import { User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NameChangeForm } from "./name-change-form";
import { PasswordChangeForm } from "./password-change-form";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { User as UserIcon, Calendar, Mail, Hash } from "lucide-react";

interface ProfileComponentProps {
  user: User;
  session: Session;
}

export function ProfileComponent({ user, session }: ProfileComponentProps) {
  return (
    <div className="container mx-auto p-4 space-y-8">
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
              <AvatarFallback className="text-xl font-bold text-primary bg-primary/10">{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
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
