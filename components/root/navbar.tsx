import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/root/mobile-menu";
import Image from "next/image";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { signOut } from "@/auth";

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
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Image src="/icon_logo.png" alt="RoyalMotionIT" width={24} height={24} />
            <span className="text-xl font-bold">Royal Sign</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className={cn("text-sm font-medium transition-colors hover:text-primary")}>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex gap-4 items-center">
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
                    <Avatar className="h-8 w-8">{userImage ? <AvatarImage src={userImage} alt={userName || "User"} /> : <AvatarFallback>{getInitials(userName)}</AvatarFallback>}</Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[var(--radix-dropdown-menu-content-available-height)] max-h-72">
                    <Link href="/dashboard">
                      <DropdownMenuItem>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/settings">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin/dashboard">
                        <DropdownMenuItem className="text-primary">
                          <User className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <form
                      action={async () => {
                        await signOut({ redirect: true, redirectTo: "/auth/login" });
                      }}
                      method="post"
                    >
                      <DropdownMenuItem className="text-destructive" asChild>
                        <button className="w-full flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sign out</span>
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button variant="outline" asChild className="hidden sm:inline-flex">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <MobileMenu navItems={navItems} isLoggedIn={isLoggedIn} userName={userName} userEmail={userEmail} userImage={userImage} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
