"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  showUserInfo?: boolean;
  userName?: string;
  userEmail?: string;
  userId?: string;
  userImage?: string | null;
  icon?: ReactNode;
}

export function PageHeader({
  title,
  description,
  showUserInfo = false,
  userName = "",
  userEmail = "",
  userId = "",
  userImage = null,
  icon
}: PageHeaderProps) {
  // Helper function to get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/30 p-6 rounded-xl border border-border shadow-sm mb-8">
      <div className="space-y-2 flex items-center gap-3">
        {icon && <div className="hidden sm:flex">{icon}</div>}
        <div>
          <h1 className="text-3xl font-bold tracking-tighter md:text-4xl">{title}</h1>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>
      </div>
      
      {showUserInfo && (
        <div className="flex items-center gap-4 bg-card p-3 rounded-lg border border-border shadow-sm">
          <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-md">
            <AvatarImage src={userImage ?? undefined} alt={userName || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
              {getInitials(userName || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium text-lg">{userName || "User"}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            {userId && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="size-3 text-primary" /> {userId}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}