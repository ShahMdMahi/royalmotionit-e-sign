import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents - Royal Sign - RoyalMotionIT",
  description: "User documents for Royal Sign e-signature application.",
};

export default async function Documents() {
  const session = await auth();
  if (session) {
    return (
      <div>
        <div>Welcome</div>
        <div>User Documents</div>
        <div>Additional Content Here</div>
      </div>
    );
  } else {
    redirect("/auth/login");
  }
}
