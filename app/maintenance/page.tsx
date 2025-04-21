import Maintenance from "@/components/root/maintainance";
import { get } from "@vercel/edge-config";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Maintenance - Royal Sign- RoyalMotionIT",
  description: "Royal Sign is currently under maintenance. Please check back later.",
};

export default async function MaintenancePage() {
  const maintenanceMode = await get("MAINTENANCE_MODE_ACTIVE");
  if (!maintenanceMode) {
    redirect("/");
  } else {
    return <Maintenance />;
  }
}
