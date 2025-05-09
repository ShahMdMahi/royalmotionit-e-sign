import { Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us - Royal Sign",
  description: "Get in touch with the Royal Sign team for inquiries, support, or partnerships.",
};

export default async function Contact() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Header Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">Get in Touch</h1>
        <p className="text-lg text-muted-foreground">Have questions about our e-signature solution? We&apos;d love to hear from you. Our team is ready to assist with any inquiries.</p>
      </section>

      {/* Contact Information Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover border">
          <CardHeader className="pb-2">
            <Mail className="text-primary h-6 w-6 mb-2" />
            <CardTitle>Email Us</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-2">Send us an email and we&apos;ll get back to you within 24 hours.</CardDescription>
            <a href="mailto:contact@royalmotionit.com" className="text-primary font-medium">
              contact@royalmotionit.com
            </a>
          </CardContent>
        </Card>

        <Card className="card-hover border">
          <CardHeader className="pb-2">
            <Phone className="text-primary h-6 w-6 mb-2" />
            <CardTitle>Call Us</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-2">Our customer service team is available during business hours.</CardDescription>
            <a href="tel:+1-555-123-4567" className="text-primary font-medium">
              +1-555-123-4567
            </a>
          </CardContent>
        </Card>

        <Card className="card-hover border">
          <CardHeader className="pb-2">
            <MapPin className="text-primary h-6 w-6 mb-2" />
            <CardTitle>Visit Us</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-2">Stop by our office to meet the team in person.</CardDescription>
            <p className="text-primary font-medium">
              123 Tech Park Avenue
              <br />
              Suite 456
              <br />
              Silicon Valley, CA 94123
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Contact Form and Map Section */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact Form */}
        <Card className="lg:col-span-3 border">
          <CardHeader>
            <CardTitle className="gradient-text">Send us a Message</CardTitle>
            <CardDescription>Fill out the form below and a member of our team will be in touch as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" placeholder="john.doe@example.com" type="email" />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input id="phone" placeholder="+1 (555) 123-4567" type="tel" />
              </div>

              <div className="space-y-2">
                <label htmlFor="inquiry" className="text-sm font-medium">
                  Inquiry Type
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select inquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Information</SelectItem>
                    <SelectItem value="sales">Sales Inquiry</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea id="message" placeholder="Please provide details about your inquiry..." rows={5} />
              </div>

              <Button type="submit" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Map and Business Hours */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <Card className="card-hover border">
            <CardHeader className="pb-2">
              <CardTitle>Our Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-secondary rounded-md flex items-center justify-center">
                <MapPin className="h-12 w-12 text-muted-foreground" />
                <span className="sr-only">Map placeholder</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">Interactive map would be displayed here</p>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card className="card-hover border">
            <CardHeader className="pb-2">
              <Clock className="text-primary h-6 w-6 mb-2" />
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm text-muted-foreground">All times listed are in Pacific Time (PT)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold gradient-text">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Quick answers to common questions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-hover border">
            <CardHeader>
              <CardTitle className="text-lg">How quickly will I receive a response?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">We typically respond to all inquiries within 24 business hours. For urgent matters, we recommend calling our customer service line.</p>
            </CardContent>
          </Card>

          <Card className="card-hover border">
            <CardHeader>
              <CardTitle className="text-lg">Do you offer demos of your platform?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Yes! You can request a personalized demo through this contact form. A member of our sales team will arrange a convenient time.</p>
            </CardContent>
          </Card>

          <Card className="card-hover border">
            <CardHeader>
              <CardTitle className="text-lg">I need technical support. Is this the right place?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                For faster technical support, existing customers should use the support portal in their dashboard. This contact form is better for general inquiries.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border">
            <CardHeader>
              <CardTitle className="text-lg">Do you offer partnership opportunities?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We&apos;re always open to strategic partnerships! Please select &quot;Partnership Opportunity&quot; in the inquiry type field and provide details about your proposal.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg rounded-xl p-8 md:p-12 text-center text-primary-foreground">
        <div className="space-y-6 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold">Ready to Experience Royal Sign?</h2>
          <p className="text-lg">Try our e-signature platform free for 14 days. No credit card required.</p>
          <Button size="lg" className="px-12 bg-white hover:bg-white/90 text-primary" asChild>
            <Link href="/auth/register">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
