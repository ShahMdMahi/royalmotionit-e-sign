import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function () {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session.user.role === Role.ADMIN) {
    redirect("/admin/dashboard");
  } else {
    redirect("/");
  }
}
