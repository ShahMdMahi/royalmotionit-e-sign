import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";
import { get } from "@vercel/edge-config";
import { Role } from "@prisma/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Royal Sign - RoyalMotionIT",
  description: "A platform for electronic signatures and document management by RoyalMotionIT.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const maintenanceMode = await get("MAINTENANCE_MODE_ACTIVE");
  const session = await auth();
  if (maintenanceMode && session?.user?.role === Role.ADMIN) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen w-full`}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  } else {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen w-full`}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }
}
