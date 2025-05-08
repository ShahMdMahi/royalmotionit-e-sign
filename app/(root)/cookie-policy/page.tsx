import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Cookie, Info, Lock, Settings, Clock, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy - Royal Sign",
  description: "Learn about how Royal Sign uses cookies to provide and improve our e-signature service.",
};

export default function CookiePolicy() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Header Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Cookie Policy</h1>
        <p className="text-lg text-muted-foreground">How we use cookies and similar technologies on our platform</p>
      </section>

      {/* Intro Section */}
      <section className="max-w-4xl mx-auto">
        <Card className="bg-secondary/30 border">
          <CardContent className="p-6 md:p-8">
            <p className="mb-4">
              This Cookie Policy explains how RoyalMotionIT ("we", "us", or "our") uses cookies and similar technologies when you visit our Royal Sign e-signature platform and associated websites. It
              explains what these technologies are and why we use them, as well as your rights to control our use of them.
            </p>
            <p className="text-muted-foreground text-sm">Last updated: May 8, 2025</p>
          </CardContent>
        </Card>
      </section>

      {/* What Are Cookies */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Cookie className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">What Are Cookies?</h2>
        </div>

        <p>
          Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information
          to the website owners. Cookies enhance your browsing experience by:
        </p>

        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Remembering your preferences and settings</li>
          <li>Helping you navigate between pages efficiently</li>
          <li>Enabling website functionality</li>
          <li>Analyzing how websites and services are used</li>
        </ul>
      </section>

      {/* Types of Cookies */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Info className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">Types of Cookies We Use</h2>
        </div>

        <div className="space-y-8">
          <Card className="border-l-4 border-l-primary card-hover border">
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-3">Essential Cookies</h3>
              <p className="mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these
                cookies.
              </p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium">Examples:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2">
                  <li>Authentication cookies that identify you when you log into our platform</li>
                  <li>Security cookies that help prevent fraudulent use</li>
                  <li>Session cookies that remember actions during a browser session</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary/70 card-hover border">
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-3">Functional Cookies</h3>
              <p className="mb-4">
                These cookies enable us to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
              </p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium">Examples:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2">
                  <li>Cookies that remember your preferred language or region</li>
                  <li>Cookies that customize the site based on your previous actions</li>
                  <li>Cookies that remember form information for easier completion</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary/50 card-hover border">
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-3">Analytics Cookies</h3>
              <p className="mb-4">These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our platform.</p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium">Examples:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2">
                  <li>Google Analytics cookies that track page visits and user behavior</li>
                  <li>Cookies that measure which features users engage with most</li>
                  <li>Cookies that help identify performance issues</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary/30 card-hover border">
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-3">Marketing Cookies</h3>
              <p className="mb-4">
                These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad. They can share information with other
                organizations or advertisers.
              </p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium">Examples:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2">
                  <li>Cookies that track which pages you visit across websites</li>
                  <li>Cookies used to build profiles of your interests</li>
                  <li>Social media platform cookies for sharing content</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Third-Party Cookies */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ExternalLink className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">Third-Party Cookies</h2>
        </div>

        <p>
          Some cookies are placed by third parties on our behalf. Third parties include search engines, providers of measurement and analytics services, social media networks, and advertising
          companies.
        </p>

        <p className="text-muted-foreground">
          These third parties may use cookies, web beacons, and similar technologies to collect information about your use of our website and other websites. This information may be used to provide
          analytics, content personalization, or advertising that is more relevant to your interests.
        </p>

        <div className="mt-4 bg-secondary/30 rounded-md p-4">
          <p className="text-sm font-medium">Third-Party Services We Use:</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li>• Google Analytics (analytics)</li>
            <li>• Intercom (customer support)</li>
            <li>• Stripe (payment processing)</li>
            <li>• LinkedIn Insights (marketing)</li>
            <li>• Hotjar (user experience analysis)</li>
          </ul>
          <p className="text-sm mt-4 text-muted-foreground">
            Each third party has its own privacy and cookie policies. We encourage you to read these providers' privacy policies to understand their practices.
          </p>
        </div>
      </section>

      {/* Managing Cookies */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">Managing Your Cookies</h2>
        </div>

        <p>Most web browsers allow you to control cookies through their settings preferences. Here's how you can manage cookies in popular browsers:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Google Chrome</h4>
              <p className="text-sm text-muted-foreground">Settings → Privacy and Security → Cookies and other site data</p>
            </CardContent>
          </Card>

          <Card className="card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Mozilla Firefox</h4>
              <p className="text-sm text-muted-foreground">Options → Privacy & Security → Cookies and Site Data</p>
            </CardContent>
          </Card>

          <Card className="card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Safari</h4>
              <p className="text-sm text-muted-foreground">Preferences → Privacy → Cookies and website data</p>
            </CardContent>
          </Card>

          <Card className="card-hover border">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Microsoft Edge</h4>
              <p className="text-sm text-muted-foreground">Settings → Cookies and site permissions → Manage and delete cookies</p>
            </CardContent>
          </Card>
        </div>

        <p className="text-muted-foreground mt-4">
          Please note that restricting cookies may impact the functionality of our website. If you block cookies, you may not be able to use all features of Royal Sign.
        </p>
      </section>

      {/* Cookie Consent */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Lock className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">Your Consent</h2>
        </div>

        <p>
          When you first visit our website, we will ask for your consent to use cookies through a cookie banner. You can change your preferences at any time through our cookie settings accessible via
          the footer of our website.
        </p>

        <p className="text-muted-foreground">
          By continuing to use our site after setting your cookie preferences, you agree to our use of cookies in accordance with your settings and this Cookie Policy.
        </p>
      </section>

      {/* Cookie Policy Changes */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-primary flex-shrink-0" />
          <h2 className="text-3xl font-bold gradient-text">Changes to This Cookie Policy</h2>
        </div>

        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. Any changes will be posted on this page with an updated revision
          date.
        </p>

        <p className="text-muted-foreground">We encourage you to periodically review this Cookie Policy to stay informed about our use of cookies and related technologies.</p>
      </section>

      {/* Contact Section */}
      <section className="gradient-bg rounded-xl p-8 md:p-12 max-w-4xl mx-auto text-primary-foreground">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Questions About Our Cookie Policy?</h2>

          <p>If you have any questions or concerns about our use of cookies or this Cookie Policy, please contact our privacy team.</p>

          <div className="flex flex-wrap gap-4">
            <Button variant="secondary" className="bg-white hover:bg-white/90 text-primary" asChild>
              <Link href="/contact-us">Contact Us</Link>
            </Button>

            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/20" asChild>
              <Link href="mailto:privacy@royalmotionit.com">Email Privacy Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
