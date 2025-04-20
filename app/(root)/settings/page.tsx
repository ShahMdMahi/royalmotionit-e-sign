import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Royal Sign - RoyalMotionIT",
  description: "User settings for Royal Sign e-signature application.",
};

export default async function Settings() {
  const session = await auth();
  if (session) {
    return (
      <div>
        <div>Welcome</div>
        <div>User Settings</div>
        <div>Additional Content Here</div>
      </div>
    );
  } else {
    redirect("/auth/login");
  }
}
