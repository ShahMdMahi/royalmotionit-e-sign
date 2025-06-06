import { RegisterForm } from "@/components/auth/register-form";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Role } from "@prisma/client";
import { getIsGoogleAuthActive } from "@/actions/edge-config";

export const metadata: Metadata = {
  title: "Register - Authentication - Royal Sign - RoyalMotionIT",
  description:
    "Secure authentication portal for Royal Sign, providing access to electronic signature and document management services developed by RoyalMotionIT",
};

export default async function Register() {
  const isGoogleAuthActive = await getIsGoogleAuthActive();
  const session = await auth();
  if (!session) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="relative hidden bg-muted lg:block">
          <Image
            src="/logo.png"
            alt="Image"
            priority
            fill
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-end">
            <Link href="/">
              <Image src="/name_logo.png" alt="Logo" width={100} height={24} />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <RegisterForm isGoogleAuthActive={isGoogleAuthActive} />
            </div>
          </div>
        </div>
      </div>
    );
  } else if (session.user.role === Role.USER) {
    redirect("/dashboard");
  } else if (session.user.role === Role.ADMIN) {
    redirect("/admin/dashboard");
  } else {
    redirect("/");
  }
}
