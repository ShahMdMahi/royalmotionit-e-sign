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
  icon,
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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 bg-card/30 p-3 sm:p-4 md:p-6 rounded-xl border border-border shadow-sm mb-4 sm:mb-6 md:mb-8">
      <div className="space-y-1 sm:space-y-2 flex items-center gap-2 sm:gap-3">
        {icon && <div className="hidden sm:flex">{icon}</div>}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tighter md:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            {description}
          </p>
        </div>
      </div>

      {showUserInfo && (
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 bg-card p-2 sm:p-3 rounded-lg border border-border shadow-sm">
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 border-2 border-primary/30 shadow-md">
            <AvatarImage
              src={userImage ?? undefined}
              alt={userName || "User"}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm sm:text-base md:text-lg">
              {getInitials(userName || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-medium text-sm sm:text-base md:text-lg">
              {userName || "User"}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
              {userEmail}
            </p>
            {userId && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="size-2.5 sm:size-3 text-primary" />
                <span className="truncate max-w-[100px] sm:max-w-none">
                  {userId}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
