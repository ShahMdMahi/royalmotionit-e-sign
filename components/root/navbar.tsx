import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/root/mobile-menu";
import Image from "next/image";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileSignature,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logoutUser } from "@/actions/auth";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;
  const isLoggedIn = !!user;
  const isAdmin = user?.role === Role.ADMIN;
  const userName = user?.name;
  const userEmail = user?.email;
  const userImage = user?.image;

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about-us" },
    { name: "Contact", href: "/contact-us" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
  ];

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Image
              src="/icon_logo.png"
              alt="RoyalMotionIT"
              width={20}
              height={20}
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
            <span className="text-base sm:text-xl font-bold">Royal Sign</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Button
                className="flex items-center h-8 sm:h-9 text-xs sm:text-sm"
                asChild
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="relative rounded-full h-7 w-7 sm:h-8 sm:w-8 p-0">
                    <Avatar className="h-8 w-8">
                      {userImage ? (
                        <AvatarImage src={userImage} alt={userName || "User"} />
                      ) : (
                        <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userName || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-full max-h-54">
                    {isAdmin && (
                      <Link href="/admin/dashboard">
                        <DropdownMenuItem className="text-primary">
                          <User className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <Link href="/dashboard">
                      <DropdownMenuItem>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/documents">
                      <DropdownMenuItem>
                        <FileSignature className="mr-2 h-4 w-4" />
                        <span>Documents</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/settings">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" asChild>
                      <form action={logoutUser}>
                        <Button
                          type="submit"
                          className="w-full flex items-center"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sign out</span>
                        </Button>
                      </form>
                    </DropdownMenuItem>
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                asChild
                className="hidden sm:inline-flex h-8 sm:h-9 text-xs sm:text-sm"
              >
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="h-8 sm:h-9 text-xs sm:text-sm">
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <MobileMenu
            navItems={navItems}
            isLoggedIn={isLoggedIn}
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
}
