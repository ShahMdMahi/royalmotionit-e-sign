import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Royal Sign - RoyalMotionIT",
  description: "Secure authentication portal for Royal Sign, providing access to electronic signature and document management services developed by RoyalMotionIT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
