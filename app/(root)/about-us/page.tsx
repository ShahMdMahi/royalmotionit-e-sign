import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Users, Award, Star, Target, Globe, Briefcase, Shield, Zap, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - Royal Sign",
  description: "Learn about RoyalMotionIT and our mission to revolutionize electronic signatures with our Royal Sign platform.",
};

export default function AboutUs() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Header Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text">About Royal Sign</h1>
        <p className="text-lg text-muted-foreground">Transforming document workflows with secure, efficient e-signatures</p>
      </section>

      {/* Company Overview */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold gradient-text">Our Story</h2>

          <p>
            Royal Sign was founded in 2020 by a team of tech entrepreneurs who recognized the need for a more secure, user-friendly, and legally compliant e-signature solution in an increasingly
            digital world.
          </p>

          <p className="text-muted-foreground">
            As businesses shifted toward remote work and digital transformation, we saw an opportunity to create a platform that would simplify the document signing process while maintaining the
            highest standards of security and compliance.
          </p>

          <p>Today, Royal Sign serves thousands of businesses and individuals across the globe, providing a seamless e-signature experience that saves time, reduces costs, and improves efficiency.</p>
        </div>

        <div className="relative h-[350px] rounded-xl overflow-hidden shadow-xl">
          <Image src="/hero.png" alt="Royal Sign Team" fill className="object-cover" priority />
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-4xl mx-auto">
        <Card className="bg-secondary/30 border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <CardContent className="p-8 border-b md:border-b-0 md:border-r border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Our Mission</h2>
              </div>

              <p className="text-muted-foreground">
                To empower businesses and individuals with a secure, legally binding, and intuitive electronic signature solution that accelerates document workflows and facilitates seamless
                transactions in a digital-first world.
              </p>
            </CardContent>

            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Our Vision</h2>
              </div>

              <p className="text-muted-foreground">
                To be the global standard for electronic signatures, known for exceptional security, ease of use, and innovation. We aim to eliminate paper from business processes worldwide,
                contributing to both operational efficiency and environmental sustainability.
              </p>
            </CardContent>
          </div>
        </Card>
      </section>

      {/* Core Values */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold gradient-text">Our Core Values</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">These principles guide everything we do – from product development to customer service</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="card-hover border h-full">
            <CardContent className="p-6 space-y-4">
              <div className="bg-primary/10 p-3 rounded-full w-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium">Security First</h3>
              <p className="text-muted-foreground">We prioritize the security and privacy of your data above all else, implementing industry-leading encryption and protection measures.</p>
            </CardContent>
          </Card>

          <Card className="card-hover border h-full">
            <CardContent className="p-6 space-y-4">
              <div className="bg-primary/10 p-3 rounded-full w-fit">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium">Excellence</h3>
              <p className="text-muted-foreground">
                We strive for excellence in every aspect of our business, from software development to customer support, ensuring a premium experience for our users.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border h-full">
            <CardContent className="p-6 space-y-4">
              <div className="bg-primary/10 p-3 rounded-full w-fit">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium">Innovation</h3>
              <p className="text-muted-foreground">We continuously innovate and improve our platform, embracing new technologies to solve complex problems and enhance user experience.</p>
            </CardContent>
          </Card>

          <Card className="card-hover border h-full">
            <CardContent className="p-6 space-y-4">
              <div className="bg-primary/10 p-3 rounded-full w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium">Customer Focus</h3>
              <p className="text-muted-foreground">Our customers are at the center of everything we do. We listen to feedback, anticipate needs, and build solutions that truly serve our users.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold gradient-text">Our Leadership Team</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">Meet the experienced professionals guiding Royal Sign&apos;s vision and growth</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary/20">
              <Image src="https://randomuser.me/api/portraits/men/32.jpg" alt="CEO" fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Michael Harrison</h3>
              <p className="text-primary">Chief Executive Officer</p>
            </div>
            <p className="text-sm text-muted-foreground">Former fintech executive with 15+ years of experience in digital transformation</p>
          </div>

          <div className="text-center space-y-3">
            <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary/20">
              <Image src="https://randomuser.me/api/portraits/women/44.jpg" alt="CTO" fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Sophia Chen</h3>
              <p className="text-primary">Chief Technology Officer</p>
            </div>
            <p className="text-sm text-muted-foreground">Cybersecurity expert with background in cryptographic systems and digital identity</p>
          </div>

          <div className="text-center space-y-3">
            <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary/20">
              <Image src="https://randomuser.me/api/portraits/men/67.jpg" alt="COO" fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-lg">David Rodriguez</h3>
              <p className="text-primary">Chief Operating Officer</p>
            </div>
            <p className="text-sm text-muted-foreground">Operations strategist with expertise scaling SaaS businesses internationally</p>
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <Globe className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold gradient-text text-center">Our Global Presence</h2>
        </div>

        <Card className="border">
          <CardContent className="p-0 overflow-hidden">
            <div className="p-6">
              <p className="text-center mb-6">Royal Sign serves customers in over 150 countries, with offices in key locations around the world</p>

              <div className="relative h-[400px] w-full rounded bg-muted">
                {/* This would be replaced with an actual map component */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">World map visualization would go here</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 border-t">
              <div className="p-4 text-center border-r">
                <h4 className="text-3xl font-bold text-primary">150+</h4>
                <p className="text-sm text-muted-foreground">Countries Served</p>
              </div>

              <div className="p-4 text-center border-r">
                <h4 className="text-3xl font-bold text-primary">5M+</h4>
                <p className="text-sm text-muted-foreground">Users Worldwide</p>
              </div>

              <div className="p-4 text-center border-r">
                <h4 className="text-3xl font-bold text-primary">250+</h4>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>

              <div className="p-4 text-center">
                <h4 className="text-3xl font-bold text-primary">8</h4>
                <p className="text-sm text-muted-foreground">Global Offices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold gradient-text text-center">What Our Customers Say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-hover border">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>

              <blockquote className="italic text-muted-foreground">
                "Royal Sign has transformed how our legal team handles contracts. The platform is intuitive, secure, and has cut our document processing time by 75%. The audit trail feature gives us
                peace of mind for compliance.&quot;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image src="https://randomuser.me/api/portraits/women/33.jpg" alt="Testimonial" fill className="object-cover" />
                </div>
                <div>
                  <p className="font-medium">Jennifer Lawson</p>
                  <p className="text-sm text-muted-foreground">Legal Director, Acme Corp</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>

              <blockquote className="italic text-muted-foreground">
                &quot;As a small business owner, I needed an e-signature solution that was affordable yet professional. Royal Sign delivers on both fronts, plus their customer service is exceptional.
                I can&apos;t imagine running my business without it now.&quot;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image src="https://randomuser.me/api/portraits/men/54.jpg" alt="Testimonial" fill className="object-cover" />
                </div>
                <div>
                  <p className="font-medium">Marcus Johnson</p>
                  <p className="text-sm text-muted-foreground">Founder, Bright Ideas Consulting</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Careers */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <Briefcase className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold gradient-text text-center">Join Our Team</h2>
        </div>

        <div className="text-center max-w-2xl mx-auto">
          <p>
            We&apos;re always looking for talented individuals to join our mission. At Royal Sign, you&apos;ll work on challenging projects that make a real impact in the digital transformation space.
          </p>
        </div>

        <div className="bg-secondary/30 rounded-xl p-8 mt-8 border">
          <div className="text-center space-y-4 mb-8">
            <h3 className="text-xl font-bold">Current Openings</h3>
            <p className="text-muted-foreground">Explore opportunities to grow your career with us</p>
          </div>

          <div className="space-y-4">
            <Card className="card-hover border">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Senior Full Stack Developer</h4>
                  <p className="text-sm text-muted-foreground">Remote / San Francisco</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/careers">Apply</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover border">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">UX/UI Designer</h4>
                  <p className="text-sm text-muted-foreground">London / Remote</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/careers">Apply</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover border">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Customer Success Manager</h4>
                  <p className="text-sm text-muted-foreground">Singapore / Remote</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/careers">Apply</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button variant="default" size="lg" asChild>
              <Link href="/careers">View All Positions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="gradient-bg rounded-xl p-8 md:p-12 max-w-4xl mx-auto text-primary-foreground">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Get in Touch</h2>

          <p>Have questions about Royal Sign? We&apos;d love to hear from you and discuss how we can help transform your document workflows.</p>

          <div className="flex flex-wrap gap-4">
            <Button variant="secondary" className="bg-white hover:bg-white/90 text-primary" asChild>
              <Link href="/contact-us">Contact Us</Link>
            </Button>

            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/20" asChild>
              <Link href="mailto:info@royalmotionit.com">Email Us</Link>
            </Button>

            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/20" asChild>
              <Link href="/request-demo">Request Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
