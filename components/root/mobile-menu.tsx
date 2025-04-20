"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User, FileSignature, LogIn, LogOut, Home, Info, Phone, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

export function MobileMenu({ navItems, isLoggedIn, userEmail, userName, userImage, isAdmin }: MobileMenuProps) {
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
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col w-full max-w-[85vw] sm:max-w-[350px] p-4 sm:p-6">
        <SheetHeader className="border-b pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex justify-start items-center gap-2 mb-2">
            <Image src="/icon_logo.png" alt="RoyalMotionIT" width={30} height={30} />
            <SheetTitle>Royal Sign</SheetTitle>
          </div>
          <SheetDescription className="text-xs sm:text-sm">E-Signature Platform by RoyalMotionIT</SheetDescription>
        </SheetHeader>

        {isLoggedIn && (
          <div className="flex items-center gap-3 my-4 p-3 bg-muted/50 rounded-md mx-0.5">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">{userImage ? <AvatarImage src={userImage} alt={userName || "User"} /> : <AvatarFallback>{getInitials(userName)}</AvatarFallback>}</Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{userName || "User"}</span>
              <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 sm:gap-2 my-2 sm:my-4 flex-1 overflow-y-auto max-h-[50vh] sm:max-h-[60vh] px-0.5">
          <span className="text-xs font-medium text-muted-foreground mb-1 px-1">NAVIGATION</span>

          <Link href="/" className="flex items-center text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 hover:text-primary transition-colors rounded hover:bg-muted/50" onClick={() => setIsOpen(false)}>
            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
            Home
          </Link>

          {navItems
            .filter((item) => item.name !== "Home")
            .map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 hover:text-primary transition-colors rounded hover:bg-muted/50"
                onClick={() => setIsOpen(false)}
              >
                {item.name === "About" && <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />}
                {item.name === "Contact" && <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />}
                {item.name === "Privacy Policy" && <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />}
                {item.name === "Terms of Service" && <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />}
                {item.name}
              </Link>
            ))}
        </div>

        <Separator className="my-2 -mx-4 sm:-mx-6" />

        <div className="flex flex-col gap-2 mt-1 sm:mt-2 px-0.5">
          {isLoggedIn ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 text-primary text-xs sm:text-sm h-8 sm:h-9 px-3"
                    onClick={() => {
                      router.push("/admin/dashboard");
                      setIsOpen(false);
                    }}
                  >
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Admin
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs sm:text-sm h-8 sm:h-9 px-3"
                  onClick={() => {
                    router.push("/dashboard");
                    setIsOpen(false);
                  }}
                >
                  <FileSignature className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Dashboard
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs sm:text-sm h-8 sm:h-9 px-3"
                  onClick={() => {
                    router.push("/dashboard/profile");
                    setIsOpen(false);
                  }}
                >
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Profile
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs sm:text-sm h-8 sm:h-9 px-3"
                  onClick={() => {
                    router.push("/dashboard/settings");
                    setIsOpen(false);
                  }}
                >
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Settings
                </Button>
              </div>

              <Separator className="my-2 -mx-4 sm:-mx-6" />

              <form action={logoutUser} className="w-full">
                <Button type="submit" variant="destructive" size="sm" className="justify-start gap-2 w-full text-xs sm:text-sm h-8 sm:h-9 px-3">
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 w-full text-xs sm:text-sm h-8 sm:h-9 px-3"
                onClick={() => {
                  router.push("/auth/login");
                  setIsOpen(false);
                }}
              >
                <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Login
              </Button>
              <Button
                size="sm"
                className="justify-start gap-2 w-full text-xs sm:text-sm h-8 sm:h-9 px-3"
                onClick={() => {
                  router.push("/auth/register");
                  setIsOpen(false);
                }}
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Register
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
