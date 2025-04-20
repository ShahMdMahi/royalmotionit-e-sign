import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - Royal Sign - RoyalMotionIT",
  description: "User profile for Royal Sign e-signature application.",
};

export default async function Profile() {
  const session = await auth();
  if (session) {
    return (
      <div>
        <div>Welcome</div>
        <div>User Profile</div>
        <div>Additional Content Here</div>
      </div>
    );
  } else {
    redirect("/auth/login");
  }
}
