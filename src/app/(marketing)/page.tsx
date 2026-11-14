'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card as ShadCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronRight,
  CheckCircle2,
  Home as HomeIcon,
  DollarSign,
  Mail,
  Sparkles,
  LayoutGrid,
  Info,
  Briefcase,
  IndianRupee,
  MessageCircle,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { PillBase } from '@/components/ui/3d-adaptive-navigation-bar';
import { ModeToggle } from '@/components/mode-toggle';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { AnimatedMarqueeHero } from '@/components/ui/hero-3';
import TestimonialsV2 from '@/components/ui/testimonial-v2';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoScroll from "embla-carousel-auto-scroll";
import { Timeline } from '@/components/ui/timeline';
import { CircularRevealHeading } from '@/components/ui/circular-reveal-heading';
import { TextDisperse } from '@/components/ui/text-disperse';
import WhyChooseZaaykaTech from '@/components/WhyChooseZaaykaTech';
import PricingCards from '@/components/ui/pricing-component';
import { LetsWorkTogether } from '@/components/ui/lets-work-section';
import { LogoCloud } from '@/components/ui/logo-cloud-3';

const DEMO_IMAGES = [
  "/hero/image-1.jpg",
  "/hero/image-2.jpg",
  "/hero/image-3.jpg",
  "/hero/image-4.jpg",
  "/hero/image-5.jpg",
  "/hero/image-6.jpg",
  "/hero/image-7.jpg",
  "/hero/image-8.jpg",
  "/hero/image-9.jpg",
  "/hero/image-10.jpg",
  "/hero/image-11.jpg",
  "/hero/image-12.jpg",
  "/hero/image-13.jpg",
  "/hero/image-14.jpg",
  "/hero/image-15.jpg",
  "/hero/image-16.jpg",
];

const DEMO_IMAGE_LINKS: (string | null)[] = [
  "https://cafeninefifty.netlify.app",
  "https://madhuban.netlify.app",
  "https://bombaydarbarhotel.netlify.app",
  "https://menu-monto.netlify.app",
  "https://aroma-menu.netlify.app",
  "https://makesd.in",
  "https://makesd.in",
  null,
  null,
  null,
  "https://cafeninefifty.netlify.app",
  "https://aroma-menu.netlify.app",
  "https://makesd.in",
  "https://madhuban.netlify.app",
  "https://bombaydarbarhotel.netlify.app",
  "https://menu-monto.netlify.app",
];

const restaurantLogos = [
  { alt: 'Cafe 950' },
  { alt: 'Madhuban' },
  { alt: 'Bombay Darbar' },
  { alt: 'Monto' },
  { alt: 'Anjushree' },
  { alt: "Makes'D" },
  { alt: 'The Grand Hotel' },
  { alt: 'Royal Feast' },
];

const latestWorkData = [
  {
    title: "Cafe 950",
    content: (
      <a
        href="https://cafeninefifty.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-[1.02] transition-transform block"
      >
        <ShadCard className="h-full bg-secondary/30 hover:bg-secondary/50 transition-colors overflow-hidden border-none shadow-none">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-headline">Cafe 950</CardTitle>
            <CardDescription className="text-xs md:text-sm">A modern digital menu experience for Cafe 950's guests.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image src="/desktop/cafe950.png" alt="Cafe 950 preview" width={600} height={400} className="rounded-lg object-cover w-full aspect-video" data-ai-hint="cafe menu" />
          </CardContent>
        </ShadCard>
      </a>
    ),
  },
  {
    title: "Anjushree Restaurant",
    content: (
      <a
        href="https://aroma-menu.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-[1.02] transition-transform block"
      >
        <ShadCard className="h-full bg-secondary/30 hover:bg-secondary/50 transition-colors overflow-hidden border-none shadow-none">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-headline">Anjushree Restaurant</CardTitle>
            <CardDescription className="text-xs md:text-sm">An interactive digital menu for a fine dining restaurant experience.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image src="/desktop/anjushreee aroma.png" alt="Anjushree preview" width={600} height={400} className="rounded-lg object-cover w-full aspect-video" data-ai-hint="restaurant menu" />
          </CardContent>
        </ShadCard>
      </a>
    ),
  },
  {
    title: "Monto",
    content: (
      <a
        href="https://menu-monto.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-[1.02] transition-transform block"
      >
        <ShadCard className="h-full bg-secondary/30 hover:bg-secondary/50 transition-colors overflow-hidden border-none shadow-none">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-headline">Monto</CardTitle>
            <CardDescription className="text-xs md:text-sm">A sleek QR menu for Monto's vibrant dining atmosphere.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image src="/desktop/monto.png" alt="Monto preview" width={600} height={400} className="rounded-lg object-cover w-full aspect-video" data-ai-hint="restaurant menu" />
          </CardContent>
        </ShadCard>
      </a>
    ),
  },
  {
    title: "Madhuban",
    content: (
      <a
        href="https://madhuban.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-[1.02] transition-transform block"
      >
        <ShadCard className="h-full bg-secondary/30 hover:bg-secondary/50 transition-colors overflow-hidden border-none shadow-none">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-headline">Madhuban</CardTitle>
            <CardDescription className="text-xs md:text-sm">Elegant digital menu crafted for Madhuban's traditional flavours.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image src="/desktop/madhuban.png" alt="Madhuban preview" width={600} height={400} className="rounded-lg object-cover w-full aspect-video" data-ai-hint="restaurant menu" />
          </CardContent>
        </ShadCard>
      </a>
    ),
  },
  {
    title: "Bombay Darbar Restaurant",
    content: (
      <a
        href="https://bombaydarbarhotel.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-[1.02] transition-transform block"
      >
        <ShadCard className="h-full bg-secondary/30 hover:bg-secondary/50 transition-colors overflow-hidden border-none shadow-none">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-headline">Bombay Darbar Restaurant</CardTitle>
            <CardDescription className="text-xs md:text-sm">A rich digital menu for the iconic Bombay Darbar hotel experience.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image src="/desktop/bombay darbar.png" alt="Bombay Darbar preview" width={600} height={400} className="rounded-lg object-cover w-full aspect-video" data-ai-hint="restaurant menu" />
          </CardContent>
        </ShadCard>
      </a>
    ),
  },
  {
    title: "Makes'D",
    content: (
      <a
        href="https://makesd.in"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-[1.02] transition-transform block"
      >
        <ShadCard className="h-full bg-secondary/30 hover:bg-secondary/50 transition-colors overflow-hidden border-none shadow-none">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-headline">Makes'D</CardTitle>
            <CardDescription className="text-xs md:text-sm">A stylish digital menu for a modern café experience at Makes'D.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image src="/desktop/maked.png" alt="Makes'D preview" width={600} height={400} className="rounded-lg object-cover w-full aspect-video" data-ai-hint="cafe menu" />
          </CardContent>
        </ShadCard>
      </a>
    ),
  },
  {
    title: "ZaaykaTech (Official)",
    content: (
      <a
        href="https://zaaykatech.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-[1.02] transition-transform block"
      >
        <ShadCard className="h-full bg-secondary/30 hover:bg-secondary/50 transition-colors overflow-hidden border-none shadow-none">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-headline">ZaaykaTech (Official)</CardTitle>
            <CardDescription className="text-xs md:text-sm">The official website for ZaaykaTech, showcasing our services and brand.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image src="https://picsum.photos/seed/zaayka/600/400" alt="ZaaykaTech preview" width={600} height={400} className="rounded-lg object-cover w-full aspect-video" data-ai-hint="website preview" />
          </CardContent>
        </ShadCard>
      </a>
    ),
  },
];

const circularItems = [
  {
    text: "QR MENUS",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop"
  },
  {
    text: "DIGITAL MENUS",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop"
  },
  {
    text: "SMART DINING",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop"
  },
  {
    text: "FAST SERVICE",
    image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=400&fit=crop"
  },
];

const morphingTitles = [
  "Smart QR Menu",
  "Digital Menu System",
  "Instant Menu Access",
  "Scan & Browse",
  "Contactless Dining",
  "Smart Restaurant Tech",
  "Modern Menu Experience",
  "QR Powered Menu",
  "Menu Made Digital",
  "Next-Gen Menus",
  "Scan. Choose. Dine.",
  "Menus, But Smarter",
  "Dining Goes Digital",
  "Your Menu, Reimagined",
  "Smart Menus for Restaurants"
];

const desktopNavItems = [
  { name: 'Home', url: '/', icon: HomeIcon },
  { name: 'Why Us', url: '/#features', icon: Info },
  { name: 'Our Work', url: '/#work', icon: Briefcase },
  { name: 'Pricing', url: '/pricing', icon: IndianRupee },
  { name: 'Contact', url: '/#contact', icon: MessageCircle }
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Desktop Navigation (Top) */}
      <div className="hidden md:block">
        <NavBar items={desktopNavItems} />
      </div>

      {/* Mobile Navigation & Theme Toggle Wrapper */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex md:hidden items-center gap-4 w-fit pointer-events-none">
        <div className="pointer-events-auto">
          <PillBase />
        </div>
        <div className="bg-background/80 backdrop-blur-md rounded-full border border-border p-1 shadow-lg pointer-events-auto">
          <ModeToggle />
        </div>
      </div>
      <main className="flex-grow">
        {/* Hero Section */}
        <AnimatedMarqueeHero
          tagline="THE FUTURE OF DINING IS HERE"
          title="Your restaurant’s digital menu. Managed in minutes."
          description="Create your QR menu, update dishes and prices, and manage everything from one simple dashboard."
          actions={
            <>
              <Link
                href="/login"
                className="min-h-[56px] h-14 px-8 py-3.5 w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Sign in
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
              <Link
                href="/r/chai-point"
                className="min-h-[56px] h-14 px-6 py-3.5 w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border bg-card/60 backdrop-blur-sm text-foreground font-medium text-base hover:bg-accent/40 active:scale-[0.98] transition-all"
              >
                View demo
              </Link>
            </>
          }
          images={DEMO_IMAGES}
          imageLinks={DEMO_IMAGE_LINKS}
        />

        {/* Why Choose ZaaykaTech Section */}
        <WhyChooseZaaykaTech />

        {/* Latest Work Timeline Section */}
        <section id="work" className="bg-background">
          <Timeline data={latestWorkData} />
        </section>

        {/* Circular Brand Section */}
        <section className="overflow-x-hidden bg-background py-20 md:py-28 flex flex-col items-center justify-center gap-6">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">What We Do</h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">Hover over each word to explore</p>
          </div>
          <CircularRevealHeading
            items={circularItems}
            size="lg"
            centerText={
              <div className="text-center">
                <div className="text-2xl font-extrabold text-[#333] tracking-tight font-headline">ZaaykaTech</div>
                <div className="text-xs text-[#777] mt-1 tracking-widest uppercase">Est. 2024</div>
              </div>
            }
          />
        </section>

        {/* As Used In Section */}
        <section className="bg-background py-0">
          <div className="container mx-auto px-4">
            <h3 className="text-center text-lg md:text-xl text-muted-foreground/40 font-semibold tracking-[0.2em] uppercase mb-4">
              Trusted by leading Cafe & Restaurants
            </h3>
            <div className="relative">
              <LogoCloud logos={restaurantLogos} />
            </div>
          </div>
        </section>

        <section id="testimonials-section">
          <TestimonialsV2 />
        </section>



        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28 bg-secondary/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Pricing</p>
              <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-muted-foreground text-base md:text-lg">
                One annual fee. No hidden charges. Everything your restaurant needs to go digital.
              </p>
            </div>
            <PricingCards />
          </div>
        </section>

        {/* Contact Section */}
        <LetsWorkTogether />

      </main>
      <Footer />
    </div >
  );
}