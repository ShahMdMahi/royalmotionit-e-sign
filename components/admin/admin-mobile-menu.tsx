"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  User,
  FileSignature,
  LogOut,
  Home,
  Settings,
  Users,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { logoutUser } from "@/actions/auth";
import { cn } from "@/lib/utils";

interface AdminMobileMenuProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function AdminMobileMenu({
  userName,
  userEmail,
  userImage,
}: AdminMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const adminNavItems = [
    { name: "Home", href: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    {
      name: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: <Shield className="h-4 w-4 mr-2" />,
    },
    {
      name: "User Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
    },
    {
      name: "Documents",
      href: "/admin/documents",
      icon: <FileSignature className="h-4 w-4 mr-2" />,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      name: "Admin Profile",
      href: "/admin/profile",
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      name: "Admin Settings",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
  ];

  // Extract initials from name for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((part) => part?.[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle admin menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col w-full max-w-[80vw] sm:max-w-[300px] p-0"
      >
        <SheetHeader className="border-b pb-4 pt-4 px-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-md bg-primary/10 flex items-center justify-center">
              <Image
                src="/icon_logo.png"
                alt="RoyalMotionIT"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-base font-bold text-left">
                Admin Panel
              </SheetTitle>
              <SheetDescription className="text-xs text-left mt-0">
                Royal Sign Administrator
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Display user info if available */}
        {userName && (
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-md">
              <Avatar className="h-8 w-8">
                {userImage ? (
                  <AvatarImage src={userImage} alt={userName || "Admin"} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(userName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">
                  {userName || "Admin"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </span>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col gap-1 py-3 px-2">
            <span className="text-xs font-medium text-muted-foreground mb-2 px-2 uppercase tracking-wider">
              Admin Navigation
            </span>

            {adminNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center text-sm py-2 px-3 hover:text-primary transition-colors rounded-md hover:bg-muted",
                  item.name === "Admin Dashboard" &&
                    "text-primary bg-primary/10",
                  item.name === "User Dashboard" && "text-primary",
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>

          <Separator className="my-2 mx-2" />

          <div className="flex flex-col gap-2 py-3 px-4">
            <form action={logoutUser} className="w-full">
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="justify-start gap-2 w-full text-sm h-9"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
