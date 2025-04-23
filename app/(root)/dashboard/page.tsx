import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DashboardComponent } from "@/components/root/dashboard";

export const metadata: Metadata = {
  title: "Dashboard - Royal Sign - RoyalMotionIT",
  description: "User dashboard for Royal Sign e-signature application.",
};

export default async function Dashboard() {
  const session = await auth();
  if (session) {
    return <DashboardComponent />;
  } else {
    redirect("/auth/login");
  }
}
