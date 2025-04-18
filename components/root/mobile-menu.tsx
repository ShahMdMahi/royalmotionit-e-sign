"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User, FileSignature, LogIn, LogOut, Home, Info, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

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

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    setIsOpen(false);
  };

  // Extract initials from name for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
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
      <SheetContent className="flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex justify-start items-center gap-2 mb-2">
            <Image src="/icon_logo.png" alt="RoyalMotionIT" width={30} height={30} />
            <SheetTitle>Royal Sign</SheetTitle>
          </div>
          <SheetDescription>E-Signature Platform by RoyalMotionIT</SheetDescription>
        </SheetHeader>

        {isLoggedIn && (
          <div className="flex items-center gap-3 my-4 p-3 bg-muted/50 rounded-md">
            <Avatar>{userImage ? <AvatarImage src={userImage} alt={userName || "User"} /> : <AvatarFallback>{getInitials(userName)}</AvatarFallback>}</Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userName || "User"}</span>
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 my-4 flex-1">
          <span className="text-xs font-medium text-muted-foreground mb-1">NAVIGATION</span>

          <Link href="/" className="flex items-center text-sm py-2 px-1 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
            <Home className="h-4 w-4 mr-3" />
            Home
          </Link>

          {navItems
            .filter((item) => item.name !== "Home")
            .map((item) => (
              <Link key={item.name} href={item.href} className="flex items-center text-sm py-2 px-1 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                {item.name === "About" && <Info className="h-4 w-4 mr-3" />}
                {item.name === "Contact" && <Phone className="h-4 w-4 mr-3" />}
                {item.name === "Privacy Policy" && <FileText className="h-4 w-4 mr-3" />}
                {item.name === "Terms of Service" && <FileText className="h-4 w-4 mr-3" />}
                {item.name}
              </Link>
            ))}
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-2 mt-2">
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => {
                    router.push("/admin/dashboard");
                    setIsOpen(false);
                  }}
                >
                  <User className="h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => {
                  router.push("/dashboard");
                  setIsOpen(false);
                }}
              >
                <FileSignature className="h-4 w-4" />
                My Documents
              </Button>
              <Button variant="destructive" className="justify-start gap-2 mt-1" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="justify-start gap-2 w-full"
                onClick={() => {
                  router.push("/auth/login");
                  setIsOpen(false);
                }}
              >
                <LogIn className="h-4 w-4" />
                Log in
              </Button>
              <Button
                className="justify-start gap-2 w-full"
                onClick={() => {
                  router.push("/auth/register");
                  setIsOpen(false);
                }}
              >
                <User className="h-4 w-4" />
                Get Started
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
