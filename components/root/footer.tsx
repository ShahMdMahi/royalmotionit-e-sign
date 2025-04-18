import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Image src="/icon_logo.png" alt="RoyalMotionIT" width={40} height={40} />
              <span className="text-xl font-bold">RoyalMotionIT</span>
            </div>
            <p className="text-sm text-muted-foreground">Simplify your document workflow with our secure e-signature solution. Sign, send, and manage documents from anywhere.</p>
            <div className="flex space-x-3 mt-2">
              <Link href="#" className="hover:text-primary transition-colors">
                <Facebook size={18} />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Twitter size={18} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Instagram size={18} />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Linkedin size={18} />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <Link href="/" className="text-sm hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/about-us" className="text-sm hover:text-primary transition-colors">
              About Us
            </Link>
            <Link href="/contact-us" className="text-sm hover:text-primary transition-colors">
              Contact Us
            </Link>
            <Link href="/auth/login" className="text-sm hover:text-primary transition-colors">
              Login
            </Link>
            <Link href="/auth/register" className="text-sm hover:text-primary transition-colors">
              Register
            </Link>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">Legal</h3>
            <Link href="/terms-of-service" className="text-sm hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-sm hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/accessibility" className="text-sm hover:text-primary transition-colors">
              Accessibility
            </Link>
            <Link href="/cookie-policy" className="text-sm hover:text-primary transition-colors">
              Cookie Policy
            </Link>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">Subscribe to our newsletter for updates and tips.</p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input type="email" placeholder="Enter your email" className="h-9 text-sm" />
                <Button size="sm" className="h-9">
                  <Mail className="mr-1 h-4 w-4" />
                  <span>Subscribe</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">By subscribing, you agree to our Privacy Policy.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8 border-t pt-6 items-center">
          <p className="text-sm text-muted-foreground text-center">© {new Date().getFullYear()} RoyalMotionIT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
