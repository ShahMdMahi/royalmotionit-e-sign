import Footer from "@/components/root/footer";
import Navbar from "@/components/root/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Royal Sign - RoyalMotionIT",
  description: "E-signature solution by RoyalMotionIT. Securely sign, send, and manage documents online with our intuitive e-signature platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
