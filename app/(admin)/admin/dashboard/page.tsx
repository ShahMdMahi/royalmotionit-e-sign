import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  } else if (session?.user?.role !== Role.ADMIN) {
    redirect("/");
  }
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session?.user?.email}</p>
      <p>{JSON.stringify(session)}</p>
      <p>{JSON.stringify(session?.user)}</p>
    </div>
  );
}
