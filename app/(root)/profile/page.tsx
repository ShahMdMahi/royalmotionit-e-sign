import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/prisma/prisma";
import { ProfileComponent } from "@/components/root/profile";

export const metadata: Metadata = {
  title: "Profile - Royal Sign - RoyalMotionIT",
  description: "User profile for Royal Sign e-signature application.",
};

export default async function Profile() {
  const session = await auth();
  if (session) {
    if (session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (user) {
        return <ProfileComponent user={user} session={session} />;
      }
    } else {
      redirect("/auth/login");
    }
  }
}
