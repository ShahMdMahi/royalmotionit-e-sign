import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { SettingsComponent } from "@/components/root/settings";

export const metadata: Metadata = {
  title: "Settings - Royal Sign - RoyalMotionIT",
  description: "User settings for Royal Sign e-signature application.",
};

export default async function Settings() {
  const session = await auth();
  if (session) {
    return <SettingsComponent session={session} notification={session.user.notification ?? false} />;
  } else {
    redirect("/auth/login");
  }
}
