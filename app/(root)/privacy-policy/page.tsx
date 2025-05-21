import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Lock,
  User,
  FileText,
  Network,
  Share2,
  Shield,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - Royal Sign",
  description:
    "Learn how Royal Sign collects, uses, and protects your personal information in our e-signature platform.",
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Header Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">
          Privacy Policy
        </h1>
        <p className="text-lg text-muted-foreground">
          How we collect, use, and protect your information
        </p>
      </section>

      {/* Intro Section */}
      <section className="max-w-4xl mx-auto">
        <Card className="bg-secondary/30 border">
          <CardContent className="p-6 md:p-8">
            <p className="mb-4">
              At Royal Sign, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our e-signature platform and related
              services. Please read this policy carefully. If you do not agree
              with the terms of this privacy policy, please do not access the
              service.
            </p>
            <p className="text-muted-foreground text-sm">
              Last updated: May 8, 2025
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Information We Collect */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">
            Information We Collect
          </h2>
        </div>

        <p>
          We collect personal information that you voluntarily provide to us
          when you register with us, express interest in obtaining information
          about our services, or otherwise contact us.
        </p>

        <div className="space-y-6 mt-4">
          <Card className="overflow-hidden card-hover border">
            <CardHeader className="bg-primary/5 py-3">
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-muted-foreground">
              <p>We may collect the following personal information from you:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contact information (name, email address, phone number)</li>
                <li>Account credentials (username, password)</li>
                <li>Business information (company name, job title)</li>
                <li>
                  Payment information (billing address, credit card details)
                </li>
                <li>Identity verification information</li>
                <li>Electronic signatures and related document data</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="overflow-hidden card-hover border">
            <CardHeader className="bg-primary/5 py-3">
              <CardTitle className="text-lg">
                Automatically Collected Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-muted-foreground">
              <p>
                We automatically collect certain information when you visit our
                website or use our service:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Device and usage information (IP address, browser type,
                  operating system)
                </li>
                <li>Access times and pages viewed</li>
                <li>Location information</li>
                <li>
                  Information collected through cookies and tracking
                  technologies
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How We Use Your Information */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">
            How We Use Your Information
          </h2>
        </div>

        <p>
          We use the information we collect for various business purposes,
          including:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card className="h-full card-hover border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium">Providing Our Services</h3>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Creating and managing user accounts</li>
                <li>• Processing and fulfilling orders and transactions</li>
                <li>• Facilitating electronic signatures</li>
                <li>• Managing documents and workflows</li>
                <li>• Authenticating user identities</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="h-full card-hover border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Network className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium">Improving Our Services</h3>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Analyzing usage patterns and trends</li>
                <li>• Diagnosing technical problems</li>
                <li>• Developing new products and features</li>
                <li>• Conducting research and analysis</li>
                <li>• Optimizing user experience</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="h-full card-hover border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium">Communications</h3>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Sending administrative notifications</li>
                <li>• Providing customer support</li>
                <li>• Sending service updates</li>
                <li>• Marketing communications (with consent)</li>
                <li>• Responding to inquiries</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="h-full card-hover border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium">Legal and Security</h3>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Enforcing our terms and policies</li>
                <li>• Detecting and preventing fraud</li>
                <li>• Protecting against security risks</li>
                <li>• Complying with legal obligations</li>
                <li>• Establishing and defending legal claims</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Information Sharing */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Share2 className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">
            Information Sharing and Disclosure
          </h2>
        </div>

        <p>
          We may share your information with third parties in the following
          situations:
        </p>

        <Card className="card-hover border">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-2">Service Providers</h3>
              <p className="text-muted-foreground">
                We may share your information with third-party vendors, service
                providers, contractors, or agents who perform services for us or
                on our behalf and require access to such information to perform
                these services. They are prohibited from using your personal
                information for any other purpose.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">
                Business Transactions
              </h3>
              <p className="text-muted-foreground">
                If we are involved in a merger, acquisition, financing due
                diligence, reorganization, bankruptcy, or sale of company
                assets, your information may be transferred as part of such a
                transaction.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">Legal Requirements</h3>
              <p className="text-muted-foreground">
                We may disclose your information where we believe disclosure is
                necessary or required by law, regulation, to enforce our
                policies, or to protect our or others&apos; rights, property, or
                safety.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">With Your Consent</h3>
              <p className="text-muted-foreground">
                We may share your information with third parties when you have
                given us consent to do so.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Security */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Lock className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">Data Security</h2>
        </div>

        <p>
          We have implemented appropriate technical and organizational security
          measures designed to protect the security of any personal information
          we process. However, despite our safeguards, no security system is
          impenetrable.
        </p>

        <div className="bg-muted p-6 rounded-lg mt-4 border">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Our Security Measures Include:</h3>
          </div>
          <ul className="list-disc pl-6 space-y-2">
            <li>256-bit encryption for data transmission and storage</li>
            <li>Multi-factor authentication options</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and permissions</li>
            <li>Continuous monitoring for suspicious activities</li>
            <li>Employee training on security practices</li>
            <li>Physical safeguards for our servers and facilities</li>
          </ul>
        </div>
      </section>

      {/* Your Privacy Rights */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">
            Your Privacy Rights
          </h2>
        </div>

        <p>
          Depending on your location, you may have certain rights regarding your
          personal information:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Card className="overflow-hidden border-l-4 border-l-primary/80 card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Right to Access</h4>
              <p className="text-sm text-muted-foreground">
                You have the right to request information about the personal
                data we hold about you.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-primary/80 card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Right to Rectification</h4>
              <p className="text-sm text-muted-foreground">
                You have the right to request that we correct any information
                you believe is inaccurate.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-primary/80 card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Right to Erasure</h4>
              <p className="text-sm text-muted-foreground">
                You have the right to request that we erase your personal data,
                under certain conditions.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-primary/80 card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Right to Restrict Processing</h4>
              <p className="text-sm text-muted-foreground">
                You have the right to request that we restrict the processing of
                your personal data, under certain conditions.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-primary/80 card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Right to Data Portability</h4>
              <p className="text-sm text-muted-foreground">
                You have the right to request that we transfer the data we have
                collected to another organization, under certain conditions.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-primary/80 card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Right to Object</h4>
              <p className="text-sm text-muted-foreground">
                You have the right to object to our processing of your personal
                data, under certain conditions.
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-muted-foreground mt-4">
          To exercise any of these rights, please contact us using the
          information provided at the end of this policy. We will respond to
          your request within 30 days.
        </p>
      </section>

      {/* International Data Transfers */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Network className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">
            International Data Transfers
          </h2>
        </div>

        <p>
          Our servers are located in the United States. If you are accessing our
          service from outside the United States, please be aware that your
          information may be transferred to, stored, and processed by us in our
          facilities and by third parties with whom we may share your personal
          information.
        </p>

        <p className="text-muted-foreground">
          If you are located in the European Economic Area (EEA) or the United
          Kingdom, we ensure that any transfers of your personal data will be
          protected by appropriate safeguards, including the use of standard
          contractual clauses approved by the European Commission or other
          suitable safeguards.
        </p>
      </section>

      {/* Policy Changes */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <RefreshCcw className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">
            Changes to This Privacy Policy
          </h2>
        </div>

        <p>
          We may update this privacy policy from time to time to reflect changes
          in our practices or for other operational, legal, or regulatory
          reasons. We will post the updated policy on this page with a revised
          &quot;Last Updated&quot; date.
        </p>

        <p className="text-muted-foreground">
          We encourage you to review this policy periodically to stay informed
          about our information practices and the choices available to you. Your
          continued use of the service after any changes constitutes your
          acceptance of these changes.
        </p>
      </section>

      {/* Contact Section */}
      <section className="gradient-bg rounded-xl p-8 md:p-12 max-w-4xl mx-auto text-primary-foreground">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Contact Us</h2>

          <p>
            If you have any questions or concerns about this Privacy Policy,
            please contact our Data Protection Officer:
          </p>

          <div className="bg-background/40 p-4 rounded-lg">
            <p>Data Protection Officer</p>
            <p>RoyalMotionIT</p>
            <p>123 Tech Park Avenue, Suite 456</p>
            <p>Silicon Valley, CA 94123</p>
            <p className="mt-2">
              Email: 
              <a
                href="mailto:privacy@royalmotionit.com"
                className="text-primary"
              >
                privacy@royalmotionit.com
              </a>
            </p>
            <p>
              Phone: 
              <a href="tel:+15551234567" className="text-primary">
                +1 (555) 123-4567
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              variant="secondary"
              className="bg-white hover:bg-white/90 text-primary"
              asChild
            >
              <Link href="/contact-us">Contact Us</Link>
            </Button>

            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/20"
              asChild
            >
              <Link href="/terms-of-service">Terms of Service</Link>
            </Button>

            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/20"
              asChild
            >
              <Link href="/cookie-policy">Cookie Policy</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
