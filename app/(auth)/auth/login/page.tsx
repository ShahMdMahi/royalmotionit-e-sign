import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Role } from "@prisma/client";
import {
  getIsGoogleAuthActive,
  getIsRegistrationActive,
} from "@/actions/edge-config";

export const metadata: Metadata = {
  title: "Login - Authentication - Royal Sign - RoyalMotionIT",
  description:
    "Secure authentication portal for Royal Sign, providing access to electronic signature and document management services developed by RoyalMotionIT",
};

export default async function Login({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const isRegistrationActive = await getIsRegistrationActive();
  const isGoogleAuthActive = await getIsGoogleAuthActive();

  // Get email and returnUrl from query parameters
  const email = (await searchParams)?.email as string | undefined;
  const password = (await searchParams)?.password as string | undefined;
  const returnUrl = (await searchParams)?.returnUrl as string | undefined;

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
              <LoginForm
                isGoogleAuthActive={isGoogleAuthActive}
                isRegistrationActive={isRegistrationActive}
                prefillEmail={email}
                prefillPassword={password}
                returnUrl={returnUrl}
              />
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
