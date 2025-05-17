import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ScrollText,
  ShieldCheck,
  FileText,
  CreditCard,
  Scale,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - Royal Sign",
  description:
    "Read the Terms of Service for Royal Sign, our e-signature platform by RoyalMotionIT.",
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Header Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">
          Terms of Service
        </h1>
        <p className="text-lg text-muted-foreground">
          Please read these terms carefully before using our platform
        </p>
      </section>

      {/* Intro Section */}
      <section className="max-w-4xl mx-auto">
        <Card className="bg-secondary/30 border">
          <CardContent className="p-6 md:p-8">
            <p className="mb-4">
              These Terms of Service (&quot;Terms&quot;) govern your access to
              and use of Royal Sign, an e-signature platform
              (&quot;Service&quot;) provided by RoyalMotionIT (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;). By accessing or using our
              Service, you agree to be bound by these Terms. If you disagree
              with any part of the Terms, you may not access the Service.
            </p>
            <p className="text-muted-foreground text-sm">
              Last updated: May 8, 2025
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Agreement Sections */}
      <section className="max-w-4xl mx-auto space-y-12">
        {/* Account Terms */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
            <h2 className="text-3xl font-bold gradient-text">Account Terms</h2>
          </div>

          <Card className="card-hover border">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  1. Account Registration
                </h3>
                <p className="text-muted-foreground">
                  To use certain features of the Service, you must register for
                  an account. You must provide accurate, complete, and updated
                  information. You are solely responsible for safeguarding your
                  account credentials.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  2. Account Security
                </h3>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the security of your
                  account and password. RoyalMotionIT cannot and will not be
                  liable for any loss or damage resulting from your failure to
                  comply with this security obligation.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  3. Minimum Age Requirement
                </h3>
                <p className="text-muted-foreground">
                  The Service is intended solely for users who are at least 18
                  years of age. Any use of the Service by anyone under 18 is
                  strictly prohibited and a violation of these Terms.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Usage */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <h2 className="text-3xl font-bold gradient-text">Service Usage</h2>
          </div>

          <Card className="card-hover border">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  1. Electronic Signatures
                </h3>
                <p className="text-muted-foreground">
                  Royal Sign enables users to electronically sign documents. By
                  using our Service, you agree that your electronic signature
                  constitutes your legal signature on documents, with the same
                  validity and meaning as a handwritten signature, to the extent
                  permitted by applicable laws.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">2. Acceptable Use</h3>
                <p className="text-muted-foreground">
                  You may use the Service only for lawful purposes and in
                  accordance with these Terms. You agree not to use the Service
                  for any illegal or unauthorized purpose, including but not
                  limited to fraud, misrepresentation, or violating any third
                  party&apos;s legal rights.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  3. Service Modifications
                </h3>
                <p className="text-muted-foreground">
                  RoyalMotionIT reserves the right to modify or discontinue,
                  temporarily or permanently, the Service (or any part thereof)
                  with or without notice. We shall not be liable to you or any
                  third party for any modification, suspension, or
                  discontinuance of the Service.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Terms */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary flex-shrink-0" />
            <h2 className="text-3xl font-bold gradient-text">Payment Terms</h2>
          </div>

          <Card className="card-hover border">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  1. Subscription Plans
                </h3>
                <p className="text-muted-foreground">
                  Some features of the Service require payment of fees. You
                  shall pay all applicable fees as described on our website for
                  any subscription or paid feature of the Service. All payments
                  are non-refundable except as expressly provided in these
                  Terms.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">2. Billing Cycles</h3>
                <p className="text-muted-foreground">
                  For subscription plans, your account will be charged on a
                  recurring basis at the beginning of each billing cycle.
                  Billing cycles are typically monthly or annual, depending on
                  your selected plan.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">3. Changes to Fees</h3>
                <p className="text-muted-foreground">
                  RoyalMotionIT reserves the right to change our fees at any
                  time. If we change our fees, we will provide notice of the
                  change on our website or via email at least 30 days before the
                  change takes effect.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intellectual Property */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ScrollText className="h-8 w-8 text-primary flex-shrink-0" />
            <h2 className="text-3xl font-bold gradient-text">
              Intellectual Property
            </h2>
          </div>

          <Card className="card-hover border">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">1. Service Content</h3>
                <p className="text-muted-foreground">
                  The Service and its original content, features, and
                  functionality are and will remain the exclusive property of
                  RoyalMotionIT and its licensors. The Service is protected by
                  copyright, trademark, and other laws of both the United States
                  and foreign countries.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">2. Your Content</h3>
                <p className="text-muted-foreground">
                  You retain all rights to your content that you upload, post,
                  or otherwise make available through the Service. By providing
                  content to the Service, you grant RoyalMotionIT a worldwide,
                  non-exclusive, royalty-free license to use, reproduce, modify,
                  and display such content solely for the purpose of providing
                  the Service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">3. Feedback</h3>
                <p className="text-muted-foreground">
                  If you provide RoyalMotionIT with any feedback or suggestions
                  regarding the Service, you hereby assign to RoyalMotionIT all
                  rights in such feedback and agree that RoyalMotionIT shall
                  have the right to use such feedback in any manner it deems
                  appropriate.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Limitations of Liability */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-primary flex-shrink-0" />
            <h2 className="text-3xl font-bold gradient-text">
              Limitations of Liability
            </h2>
          </div>

          <Card className="card-hover border">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  1. Service Availability
                </h3>
                <p className="text-muted-foreground">
                  RoyalMotionIT does not warrant that the Service will be
                  uninterrupted, timely, secure, or error-free. We do not
                  warrant that the results that may be obtained from the use of
                  the Service will be accurate or reliable.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  2. Limitation of Liability
                </h3>
                <p className="text-muted-foreground">
                  In no event shall RoyalMotionIT, its directors, employees,
                  partners, agents, suppliers, or affiliates be liable for any
                  indirect, incidental, special, consequential, or punitive
                  damages, including without limitation, loss of profits, data,
                  use, goodwill, or other intangible losses, resulting from:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Your use of or inability to use the Service</li>
                  <li>
                    Any unauthorized access to or use of our servers and/or any
                    data stored therein
                  </li>
                  <li>
                    Any interruption or cessation of transmission to or from the
                    Service
                  </li>
                  <li>
                    Any bugs, viruses, or the like that may be transmitted
                    through the Service
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Governing Law */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary flex-shrink-0" />
            <h2 className="text-3xl font-bold gradient-text">
              Governing Law and Dispute Resolution
            </h2>
          </div>

          <Card className="card-hover border">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">1. Governing Law</h3>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance
                  with the laws of the State of California, without regard to
                  its conflict of law provisions.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  2. Dispute Resolution
                </h3>
                <p className="text-muted-foreground">
                  Any dispute arising from or relating to these Terms or the
                  Service shall first be attempted to be resolved through
                  good-faith negotiation. If such dispute cannot be resolved
                  within 30 days, it shall be subject to binding arbitration in
                  San Francisco, California.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">
                  3. Class Action Waiver
                </h3>
                <p className="text-muted-foreground">
                  Any proceedings to resolve disputes shall be conducted solely
                  on an individual basis. You waive your right to participate in
                  a class action lawsuit or class-wide arbitration.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Changes to Terms */}
      <section className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold gradient-text">Changes to Terms</h2>

        <p>
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. If a revision is material, we will provide at
          least 30 days&apos; notice prior to any new terms taking effect. What
          constitutes a material change will be determined at our sole
          discretion.
        </p>

        <p className="text-muted-foreground">
          By continuing to access or use our Service after any revisions become
          effective, you agree to be bound by the revised terms. If you do not
          agree to the new terms, you are no longer authorized to use the
          Service.
        </p>
      </section>

      {/* Contact Section */}
      <section className="gradient-bg rounded-xl p-8 md:p-12 max-w-4xl mx-auto text-primary-foreground">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Questions About Our Terms?</h2>

          <p>
            If you have any questions about these Terms, please contact our
            legal team.
          </p>

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
              <Link href="mailto:legal@royalmotionit.com">
                Email Legal Team
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
