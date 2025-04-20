import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  }
  return (
    <div>
      <div>Welcome</div>
      <div>User Dashboard</div>
      <div>Additional Content Here</div>
    </div>
  );
}
