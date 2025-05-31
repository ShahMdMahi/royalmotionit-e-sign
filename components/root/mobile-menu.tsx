"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  User,
  FileSignature,
  LogIn,
  LogOut,
  Home,
  Info,
  Phone,
  FileText,
  Settings,
  LayoutDashboard,
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/actions/auth";

interface MobileMenuProps {
  navItems: Array<{ name: string; href: string }>;
  isLoggedIn?: boolean;
  userEmail?: string | null;
  userName?: string | null;
  userImage?: string | null;
  isAdmin?: boolean;
}

export function MobileMenu({
  navItems,
  isLoggedIn,
  userEmail,
  userName,
  userImage,
  isAdmin,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Extract initials from name for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
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
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col w-full max-w-[85vw] xs:max-w-[80vw] sm:max-w-[300px] p-2 xs:p-3 sm:p-4"
      >
        <SheetHeader className="border-b pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
          <div className="flex justify-start items-center gap-1.5 mb-1">
            <Image
              src="/icon_logo.png"
              alt="RoyalMotionIT"
              width={24}
              height={24}
            />
            <SheetTitle className="text-base">Royal Sign</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            E-Signature Platform by RoyalMotionIT
          </SheetDescription>
        </SheetHeader>

        {isLoggedIn && (
          <div className="flex items-center gap-2 my-2 p-2 bg-muted/50 rounded-md mx-0.5">
            <Avatar className="h-6 w-6 xs:h-7 xs:w-7">
              {userImage ? (
                <AvatarImage src={userImage} alt={userName || "User"} />
              ) : (
                <AvatarFallback className="text-xs xs:text-sm">
                  {getInitials(userName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-medium truncate">
                {userName || "User"}
              </span>
              <span className="text-[10px] xs:text-xs text-muted-foreground truncate">
                {userEmail}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 my-1.5 flex-1 overflow-y-auto max-h-[50vh] px-1">
          <span className="text-xs font-medium text-muted-foreground mb-0.5 px-1">
            NAVIGATION
          </span>

          <Link
            href="/"
            className="flex items-center text-xs xs:text-sm py-1.5 px-2 hover:text-primary transition-colors rounded hover:bg-muted/50"
            onClick={() => setIsOpen(false)}
          >
            <Home className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
            Home
          </Link>

          {navItems
            .filter((item) => item.name !== "Home")
            .map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center text-xs xs:text-sm py-1.5 px-2 hover:text-primary transition-colors rounded hover:bg-muted/50"
                onClick={() => setIsOpen(false)}
              >
                {item.name === "About" && (
                  <Info className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                )}
                {item.name === "Contact" && (
                  <Phone className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                )}
                {item.name === "Privacy Policy" && (
                  <FileText className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                )}
                {item.name === "Terms of Service" && (
                  <FileText className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                )}
                {item.name}
              </Link>
            ))}
        </div>

        <Separator className="my-1.5 -mx-3 sm:-mx-4" />

        <div className="flex flex-col gap-1.5 mt-1 px-0.5">
          {isLoggedIn ? (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-1 xs:gap-1.5 text-primary text-[10px] xs:text-xs sm:text-sm h-7 xs:h-8 px-2 xs:px-3"
                    onClick={() => {
                      router.push("/admin/dashboard");
                      setIsOpen(false);
                    }}
                  >
                    <User className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                    Admin
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-1 xs:gap-1.5 text-[10px] xs:text-xs sm:text-sm h-7 xs:h-8 px-2 xs:px-3"
                  onClick={() => {
                    router.push("/dashboard");
                    setIsOpen(false);
                  }}
                >
                  <LayoutDashboard className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-1 xs:gap-1.5 text-[10px] xs:text-xs sm:text-sm h-7 xs:h-8 px-2 xs:px-3"
                  onClick={() => {
                    router.push("/documents");
                    setIsOpen(false);
                  }}
                >
                  <FileSignature className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                  Documents
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-1 xs:gap-1.5 text-[10px] xs:text-xs sm:text-sm h-7 xs:h-8 px-2 xs:px-3"
                  onClick={() => {
                    router.push("/profile");
                    setIsOpen(false);
                  }}
                >
                  <User className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                  Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-1 xs:gap-1.5 text-[10px] xs:text-xs sm:text-sm h-7 xs:h-8 px-2 xs:px-3"
                  onClick={() => {
                    router.push("/settings");
                    setIsOpen(false);
                  }}
                >
                  <Settings className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                  Settings
                </Button>
              </div>

              <Separator className="my-1.5 -mx-3 sm:-mx-4" />

              <form action={logoutUser} className="w-full">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  className="justify-start gap-1 xs:gap-1.5 w-full text-[10px] xs:text-xs sm:text-sm h-7 xs:h-8 px-2 xs:px-3"
                >
                  <LogOut className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-1 xs:gap-1.5 w-full text-[10px] xs:text-xs sm:text-sm h-7 xs:h-8 px-2 xs:px-3"
                onClick={() => {
                  router.push("/auth/login");
                  setIsOpen(false);
                }}
              >
                <LogIn className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                Login
              </Button>
              <Button
                size="sm"
                className="justify-start gap-1 xs:gap-1.5 w-full text-[10px] xs:text-xs sm:text-sm h-7 xs:h-8 px-2 xs:px-3"
                onClick={() => {
                  router.push("/auth/register");
                  setIsOpen(false);
                }}
              >
                <User className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                Register
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
