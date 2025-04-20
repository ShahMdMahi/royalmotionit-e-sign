import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileSignature, Shield, Zap, Users, ArrowRight, Laptop, Code, Lock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-8 md:py-16 lg:py-24 xl:py-32 bg-gradient-to-br from-primary/20 to-secondary/30 animate-fade-in relative">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">Sign Documents Digitally with Royal Sign</h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">Streamline your document signing process with our secure, efficient, and legally binding e-signature platform.</p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild className="font-medium">
                    <Link href="#get-started">Get Started for Free</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#demo">Request Demo</Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl backdrop-blur-sm border border-primary/10 transform rotate-3"></div>
                <div className="relative bg-background backdrop-blur-sm border border-border p-6 rounded-2xl shadow-lg">
                  <Image src="/hero.png" width={550} height={550} alt="Royal Sign Platform" className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">Features that Simplify Signing</h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Royal Sign provides all the tools you need to streamline your document signing process.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <Card className="card-hover border-none shadow-lg">
                <CardHeader className="flex flex-row items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="size-5 text-primary" />
                  </div>
                  <CardTitle>Fast Signing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">Sign documents in seconds, not days. Our streamlined process saves you valuable time.</CardDescription>
                </CardContent>
              </Card>
              <Card className="card-hover border-none shadow-lg">
                <CardHeader className="flex flex-row items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="size-5 text-primary" />
                  </div>
                  <CardTitle>Secure & Compliant</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">Bank-level security with compliance to global e-signature laws and regulations.</CardDescription>
                </CardContent>
              </Card>
              <Card className="card-hover border-none shadow-lg">
                <CardHeader className="flex flex-row items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>
                  <CardTitle>Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">Easily manage multiple signers and track document status in real-time.</CardDescription>
                </CardContent>
              </Card>
              <Card className="card-hover border-none shadow-lg">
                <CardHeader className="flex flex-row items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <FileSignature className="size-5 text-primary" />
                  </div>
                  <CardTitle>Custom Branding</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">Add your company logo and colors to maintain brand consistency throughout.</CardDescription>
                </CardContent>
              </Card>
              <Card className="card-hover border-none shadow-lg">
                <CardHeader className="flex flex-row items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="size-5 text-primary" />
                  </div>
                  <CardTitle>Audit Trail</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">Comprehensive audit trails for every document, ensuring legal validity.</CardDescription>
                </CardContent>
              </Card>
              <Card className="card-hover border-none shadow-lg">
                <CardHeader className="flex flex-row items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Code className="size-5 text-primary" />
                  </div>
                  <CardTitle>API Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">Seamlessly integrate with your existing workflows and business applications.</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">How Royal Sign Works</h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Get your documents signed in three simple steps.</p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-xl shadow-md animate-fade-up" style={{ animationDelay: "0.1s" }}>
                <div className="flex size-16 items-center justify-center rounded-full gradient-bg text-white text-xl font-bold">1</div>
                <h3 className="text-xl font-bold">Upload Document</h3>
                <p className="text-muted-foreground">Upload your document in any format - PDF, Word, or image files.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-xl shadow-md animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex size-16 items-center justify-center rounded-full gradient-bg text-white text-xl font-bold">2</div>
                <h3 className="text-xl font-bold">Add Signers</h3>
                <p className="text-muted-foreground">Specify who needs to sign and in what order. Add fields for signatures and data.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-white rounded-xl shadow-md animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <div className="flex size-16 items-center justify-center rounded-full gradient-bg text-white text-xl font-bold">3</div>
                <h3 className="text-xl font-bold">Get Signatures</h3>
                <p className="text-muted-foreground">Send for signature and track progress. Get notified when complete.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">Powerful Dashboard</h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Manage all your documents and signatures from one intuitive interface.</p>
              </div>
            </div>
            <div className="mx-auto max-w-5xl mt-12 relative">
              <div className="absolute inset-0 bg-primary/5 rounded-2xl transform rotate-1"></div>
              <div className="relative bg-white border border-border p-2 rounded-2xl shadow-xl">
                <div className="rounded-xl overflow-hidden border border-border">
                  <Image src="/placeholder.svg?height=600&width=1200" width={1200} height={600} alt="Royal Sign Dashboard" className="w-full object-cover" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="flex flex-col items-center text-center p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Laptop className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Intuitive Interface</h3>
                  <p className="text-muted-foreground">Easy to navigate dashboard with all your documents in one place.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Zap className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Real-time Updates</h3>
                  <p className="text-muted-foreground">Get instant notifications when documents are viewed or signed.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Lock className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Secure Storage</h3>
                  <p className="text-muted-foreground">All your documents are encrypted and securely stored in the cloud.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">What Our Customers Say</h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Trusted by businesses of all sizes around the world.</p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-3">
              <Card className="card-hover border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-1 text-amber-400">{"★★★★★"}</div>
                    <p className="text-muted-foreground">&quot;Royal Sign has transformed our contract signing process. What used to take days now takes minutes.&quot;</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">SJ</span>
                      </div>
                      <div>
                        <p className="font-semibold">Sarah Johnson</p>
                        <p className="text-sm text-muted-foreground">CEO, TechStart Inc.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-hover border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-1 text-amber-400">{"★★★★★"}</div>
                    <p className="text-muted-foreground">&quot;The security features and audit trail give us peace of mind for all our legal documents.&quot;</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">MC</span>
                      </div>
                      <div>
                        <p className="font-semibold">Michael Chen</p>
                        <p className="text-sm text-muted-foreground">Legal Director, Global Solutions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-hover border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-1 text-amber-400">{"★★★★★"}</div>
                    <p className="text-muted-foreground">&quot;The API integration allowed us to embed e-signatures directly into our customer portal.&quot;</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">AR</span>
                      </div>
                      <div>
                        <p className="font-semibold">Alex Rivera</p>
                        <p className="text-sm text-muted-foreground">CTO, Enterprise Systems</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">Simple, Transparent Pricing</h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Choose the plan that works best for your business.</p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-3">
              <Card className="card-hover border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <div className="text-3xl font-bold">
                    $9<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>5 documents per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>2 users</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>Basic templates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>Email support</span>
                      </li>
                    </ul>
                    <Button className="w-full" asChild>
                      <Link href="#get-started">Get Started</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-hover border-primary shadow-lg relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>
                <CardHeader>
                  <CardTitle>Professional</CardTitle>
                  <div className="text-3xl font-bold">
                    $29<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>50 documents per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>10 users</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>Advanced templates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>Priority support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>Custom branding</span>
                      </li>
                    </ul>
                    <Button className="w-full" asChild>
                      <Link href="#get-started">Get Started</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-hover border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <div className="text-3xl font-bold">
                    Custom<span className="text-sm font-normal text-muted-foreground"> pricing</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>Unlimited documents</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>Unlimited users</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>API access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>Dedicated account manager</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-primary" />
                        <span>SSO & advanced security</span>
                      </li>
                    </ul>
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="#contact">Contact Sales</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">Frequently Asked Questions</h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Find answers to common questions about Royal Sign.</p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl mt-12">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is Royal Sign legally binding?</AccordionTrigger>
                  <AccordionContent>
                    Yes, Royal Sign is legally binding in most countries. Our e-signatures comply with major e-signature laws including ESIGN, UETA, and eIDAS. Each signed document includes a
                    comprehensive audit trail that can be used as evidence in court if needed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How secure is Royal Sign?</AccordionTrigger>
                  <AccordionContent>
                    Royal Sign uses bank-level security with 256-bit encryption for all documents. We implement strict access controls, two-factor authentication, and regular security audits. All data
                    is stored in SOC 2 compliant data centers with redundant backups.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I integrate Royal Sign with other software?</AccordionTrigger>
                  <AccordionContent>
                    Royal Sign offers a comprehensive API that allows integration with CRM systems, document management platforms, and other business applications. We also provide pre-built
                    integrations with popular services like Salesforce, Google Drive, and Dropbox.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>What file formats does Royal Sign support?</AccordionTrigger>
                  <AccordionContent>
                    Royal Sign supports a wide range of file formats including PDF, Word documents (DOC, DOCX), Excel spreadsheets (XLS, XLSX), images (JPG, PNG), and more. All documents are converted
                    to PDF for signing and storage.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Can I try Royal Sign before purchasing?</AccordionTrigger>
                  <AccordionContent>
                    Yes, we offer a 14-day free trial with access to all features. No credit card is required to start your trial. You can sign up to 5 documents during the trial period to fully
                    experience the platform before making a decision.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="get-started" className="w-full py-12 md:py-24 lg:py-32 gradient-bg text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Get Started?</h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Join thousands of businesses that trust Royal Sign for their e-signature needs.</p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" variant="secondary" asChild className="font-medium">
                  <Link href="#signup">Sign Up Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-white border-white/30 hover:bg-white/10">
                  <Link href="#demo">
                    Schedule Demo <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">Contact Us</h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">Have questions? Our team is here to help. Reach out to us anytime.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <FileSignature className="size-5 text-primary" />
                    </div>
                    <span>info@royalsign.com</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <FileSignature className="size-5 text-primary" />
                    </div>
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <FileSignature className="size-5 text-primary" />
                    </div>
                    <span>123 Business Ave, Suite 100, New York, NY 10001</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-lg">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Send us a message</h3>
                  <p className="text-sm text-muted-foreground">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
                </div>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="first-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        First name
                      </label>
                      <input
                        id="first-name"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="last-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Last name
                      </label>
                      <input
                        id="last-name"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Message
                    </label>
                    <textarea
                      id="message"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                  <Button>Send Message</Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
