import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/auth";
import { Metadata } from "next";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verify Email - Authentication - Royal Sign - RoyalMotionIT",
  description: "Secure authentication portal for Royal Sign, providing access to electronic signature and document management services developed by RoyalMotionIT",
};

interface VerifyEmailPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function VerifyEmail({ params }: VerifyEmailPageProps) {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }
  const verifyEmailToken = (await params).token;
  if (!verifyEmailToken) {
    toast.error("Invalid token. Please try again.");
    setTimeout(() => {
      redirect("/");
    }, 2000);
    return;
  }
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <Image src="/logo.png" alt="Image" priority fill className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <Link href="/">
            <Image src="/name_logo.png" alt="Logo" width={100} height={24} />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {verifyEmailToken ? <VerifyEmailForm token={verifyEmailToken} /> : <div className="text-center text-muted-foreground">Invalid token. Please try again.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
