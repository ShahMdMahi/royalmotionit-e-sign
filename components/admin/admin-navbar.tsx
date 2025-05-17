import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileSignature,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Shield,
  User,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logoutUser } from "@/actions/auth";
import { auth } from "@/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function AdminNavbar() {
  // Get user session data for avatar and profile info
  const session = await auth();
  const user = session?.user;
  const userName = user?.name;
  const userEmail = user?.email;
  const userImage = user?.image;

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

  const adminNavItems = [
    { name: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
    {
      name: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      name: "User Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      name: "Documents",
      href: "/admin/documents",
      icon: <FileSignature className="h-4 w-4" />,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-primary/10">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-md bg-primary/10 flex items-center justify-center">
              <Image
                src="/icon_logo.png"
                alt="RoyalMotionIT"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none">
                Admin Panel
              </span>
              <span className="text-xs text-muted-foreground">Royal Sign</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5">
          {adminNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-muted/50",
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:flex">
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-6 w-6">
                  {userImage ? (
                    <AvatarImage src={userImage} alt={userName || "Admin"} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(userName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="font-medium hidden sm:inline-block">
                  {userName || "Admin"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userName || "Admin"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-full max-h-52">
                <Link href="/admin/dashboard">
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard">
                  <DropdownMenuItem>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>User Dashboard</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/documents">
                  <DropdownMenuItem>
                    <FileSignature className="mr-2 h-4 w-4" />
                    <span>Admin Documents</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Admin Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" asChild>
                  <form action={logoutUser} className="w-full">
                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full flex items-center justify-start p-0 h-auto font-normal"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </Button>
                  </form>
                </DropdownMenuItem>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu - Pass user data from server component */}
          <AdminMobileMenu
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
          />
        </div>
      </div>
    </header>
  );
}
