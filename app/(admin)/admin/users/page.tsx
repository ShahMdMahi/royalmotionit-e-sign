import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users - Admin - Royal Sign - RoyalMotionIT",
  description: "Users for managing administrative tasks in Royal Sign e-signature application.",
};

export default async function AdminUsers() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    return (
      <div>
        <h1>Users</h1>
        <p>Welcome {session.user.email}</p>
        <p>{JSON.stringify(session)}</p>
        <p>{JSON.stringify(session?.user)}</p>
      </div>
    );
  } else {
    redirect("/");
  }
}
