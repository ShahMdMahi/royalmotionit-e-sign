import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, MessageCircle, Keyboard, MousePointer, Volume2, Cpu, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessibility - Royal Sign",
  description: "Learn about Royal Sign's commitment to accessibility and our efforts to make our e-signature platform available to all users.",
};

export default function Accessibility() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Header Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Accessibility Statement</h1>
        <p className="text-lg text-muted-foreground">Our commitment to creating an accessible platform for all users.</p>
      </section>

      {/* Intro Section */}
      <section className="max-w-4xl mx-auto">
        <Card className="bg-secondary/30 border">
          <CardContent className="p-6 md:p-8">
            <p className="mb-4">
              At RoyalMotionIT, we believe that everyone should have equal access to digital services and content. We are committed to ensuring that our e-signature platform, Royal Sign, is accessible
              to people of all abilities. This statement outlines our ongoing efforts to enhance the accessibility of our services.
            </p>
            <p className="text-muted-foreground text-sm">Last updated: May 8, 2025</p>
          </CardContent>
        </Card>
      </section>

      {/* Key Accessibility Features */}
      <section className="space-y-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold gradient-text">Our Accessibility Features</h2>
          <p className="text-muted-foreground">Features that make our platform accessible to all users</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col h-full card-hover border">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-medium mb-2">Visual Accessibility</h3>
              <ul className="space-y-2 text-muted-foreground flex-1">
                <li>• High contrast mode support</li>
                <li>• Text resizing without loss of functionality</li>
                <li>• Screen reader compatibility</li>
                <li>• Alternative text for images</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full card-hover border">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit">
                  <Keyboard className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-medium mb-2">Keyboard Navigation</h3>
              <ul className="space-y-2 text-muted-foreground flex-1">
                <li>• Full keyboard navigation support</li>
                <li>• Logical tab order</li>
                <li>• Visible focus indicators</li>
                <li>• Keyboard shortcuts for common actions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full card-hover border">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-medium mb-2">Clear Communication</h3>
              <ul className="space-y-2 text-muted-foreground flex-1">
                <li>• Simple, clear language</li>
                <li>• Error identification and suggestions</li>
                <li>• Consistent navigation structure</li>
                <li>• Clear form labels and instructions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full card-hover border">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit">
                  <MousePointer className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-medium mb-2">Input Alternatives</h3>
              <ul className="space-y-2 text-muted-foreground flex-1">
                <li>• Touch-friendly interface</li>
                <li>• Voice control compatibility</li>
                <li>• Support for assistive technologies</li>
                <li>• Multiple ways to navigate content</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full card-hover border">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit">
                  <Volume2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-medium mb-2">Media Alternatives</h3>
              <ul className="space-y-2 text-muted-foreground flex-1">
                <li>• Captioned videos</li>
                <li>• Transcripts for audio content</li>
                <li>• No auto-playing media</li>
                <li>• Volume control for audio elements</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full card-hover border">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-medium mb-2">Technical Standards</h3>
              <ul className="space-y-2 text-muted-foreground flex-1">
                <li>• WCAG 2.1 AA compliance</li>
                <li>• WAI-ARIA support</li>
                <li>• Regular accessibility audits</li>
                <li>• Progressive enhancement approach</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Standards Compliance */}
      <section className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold gradient-text">Standards and Compliance</h2>

        <p>
          Royal Sign is designed to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make web content more accessible to people with a wide
          array of disabilities.
        </p>

        <p>Our accessibility efforts include:</p>

        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <p>
              <strong>Regular Testing:</strong> We conduct regular accessibility testing with a variety of assistive technologies, including screen readers, voice recognition software, and various
              input devices.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <p>
              <strong>User Feedback:</strong> We welcome feedback from users with disabilities to help us identify areas for improvement.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <p>
              <strong>Ongoing Training:</strong> Our development and design teams receive training on accessibility best practices.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <p>
              <strong>Accessible Documentation:</strong> We strive to ensure that all documentation, help guides, and support resources are accessible.
            </p>
          </div>
        </div>
      </section>

      {/* Known Limitations */}
      <section className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold gradient-text">Known Limitations</h2>

        <p>While we strive for full accessibility, we acknowledge some current limitations:</p>

        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Some older PDF documents may not be fully accessible.</li>
          <li>Third-party integrations may have varying levels of accessibility support.</li>
          <li>We are working to improve the accessibility of complex data visualizations.</li>
        </ul>

        <p className="mt-4">We are actively working to address these limitations and improve the overall accessibility of our platform.</p>
      </section>

      {/* Feedback Section */}
      <section className="gradient-bg rounded-xl p-8 md:p-12 max-w-4xl mx-auto text-primary-foreground">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">We Value Your Feedback</h2>

          <p>We are continuously working to improve the accessibility of Royal Sign. If you experience any barriers to using our services or have suggestions for improvement, please contact us.</p>

          <div className="flex flex-wrap gap-4">
            <Button variant="secondary" className="bg-white hover:bg-white/90 text-primary" asChild>
              <Link href="/contact-us">Contact Accessibility Team</Link>
            </Button>

            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/20" asChild>
              <Link href="mailto:accessibility@royalmotionit.com">Email Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
