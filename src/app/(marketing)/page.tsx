'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card as ShadCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  CheckCircle2,
  Home as HomeIcon,
  Sparkles,
  Info,
  Briefcase,
  IndianRupee,
  MessageCircle,
  Upload,
  Palette,
  QrCode,
  ArrowRight,
  Search,
  HelpCircle,
  Utensils,
  Check,
  Smartphone,
  Eye,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { PillBase } from '@/components/ui/3d-adaptive-navigation-bar';
import { ModeToggle } from '@/components/mode-toggle';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { AnimatedMarqueeHero } from '@/components/ui/hero-3';
import { FeatureWithImageComparison } from '@/components/ui/feature-with-image-comparison';
import WhyChooseZaaykaTech from '@/components/WhyChooseZaaykaTech';
import { Timeline } from '@/components/ui/timeline';
import TestimonialsV2 from '@/components/ui/testimonial-v2';
import PricingCards from '@/components/ui/pricing-component';
import { LetsWorkTogether } from '@/components/ui/lets-work-section';
import { LogoCloud } from '@/components/ui/logo-cloud-3';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
            <CardDescription className="text-xs md:text-sm">A modern digital menu experience for Cafe 950's dining guests.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image
              src="/desktop/cafe950.png"
              alt="Cafe 950 preview"
              width={600}
              height={400}
              loading="lazy"
              className="rounded-lg object-cover w-full aspect-video"
            />
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
            <CardDescription className="text-xs md:text-sm">An interactive digital menu for a premium dining experience.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image
              src="/desktop/anjushreee aroma.png"
              alt="Anjushree preview"
              width={600}
              height={400}
              loading="lazy"
              className="rounded-lg object-cover w-full aspect-video"
            />
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
            <Image
              src="/desktop/monto.png"
              alt="Monto preview"
              width={600}
              height={400}
              loading="lazy"
              className="rounded-lg object-cover w-full aspect-video"
            />
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
            <CardDescription className="text-xs md:text-sm">Elegant digital menu crafted for Madhuban's traditional cuisine.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image
              src="/desktop/madhuban.png"
              alt="Madhuban preview"
              width={600}
              height={400}
              loading="lazy"
              className="rounded-lg object-cover w-full aspect-video"
            />
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
            <CardDescription className="text-xs md:text-sm">A rich digital menu for the iconic Bombay Darbar dining experience.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Image
              src="/desktop/bombay darbar.png"
              alt="Bombay Darbar preview"
              width={600}
              height={400}
              loading="lazy"
              className="rounded-lg object-cover w-full aspect-video"
            />
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
            <Image
              src="/desktop/maked.png"
              alt="Makes'D preview"
              width={600}
              height={400}
              loading="lazy"
              className="rounded-lg object-cover w-full aspect-video"
            />
          </CardContent>
        </ShadCard>
      </a>
    ),
  },
];

const desktopNavItems = [
  { name: 'Home', url: '/', icon: HomeIcon },
  { name: 'Preview', url: '/#preview', icon: Eye },
  { name: 'Why Us', url: '/#features', icon: Info },
  { name: 'How It Works', url: '/#how-it-works', icon: Sparkles },
  { name: 'Pricing', url: '/pricing', icon: IndianRupee },
  { name: 'FAQ', url: '/#faq', icon: HelpCircle },
  { name: 'Contact', url: '/#contact', icon: MessageCircle },
];

const sampleDishes = [
  {
    name: "Paneer Tikka Butter Masala",
    price: "₹280",
    desc: "Tandoor-charred cottage cheese cubes in rich spiced tomato-cashew gravy.",
    veg: true,
    category: "Mains",
  },
  {
    name: "Dal Makhani",
    price: "₹220",
    desc: "Slow-simmered whole black lentils with creamy butter and mild spices.",
    veg: true,
    category: "Mains",
  },
  {
    name: "Crispy Corn & Water Chestnut",
    price: "₹190",
    desc: "Wok-tossed golden corn with cracked pepper and fresh spring onions.",
    veg: true,
    category: "Starters",
  },
  {
    name: "Butter Garlic Naan",
    price: "₹65",
    desc: "Freshly baked clay-oven flatbread infused with roasted garlic and butter.",
    veg: true,
    category: "Breads",
  },
  {
    name: "Special Masala Chai",
    price: "₹60",
    desc: "Handcrafted Assam tea brewed with fresh ginger and crushed green cardamom.",
    veg: true,
    category: "Beverages",
  },
];

const setupSteps = [
  {
    step: "01",
    title: "Upload or Paste Your Menu",
    desc: "Upload a phone photo, PDF, or CSV of your existing menu, or paste your dishes directly. Our smart parser organizes categories and prices automatically.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Review & Customize",
    desc: "Verify your dishes, adjust prices, upload your restaurant logo, and select your custom brand colors in your simple owner dashboard.",
    icon: Palette,
  },
  {
    step: "03",
    title: "Print QR & Launch",
    desc: "Download high-resolution print-ready QR codes for your tables, stands, and counter. Customers scan with their phone camera to browse instantly.",
    icon: QrCode,
  },
];

const faqs = [
  {
    question: "Do customers need to download an app or register to view the menu?",
    answer: "No. Customers simply scan the QR code with their standard smartphone camera on iOS or Android. The digital menu opens immediately in their mobile browser with zero app download, login, or registration required.",
  },
  {
    question: "How fast can I update dish prices or out-of-stock items?",
    answer: "Instantly. You can log into your owner dashboard from any mobile phone, tablet, or laptop. Edit dish names, change prices, or toggle items out-of-stock in seconds. Updates go live immediately for the next customer scan or page refresh.",
  },
  {
    question: "How does the Free Trial work and when does it begin?",
    answer: "Your 24-hour full-access free trial begins the moment you publish your digital menu in the owner dashboard. You receive unrestricted access to test QR table scans, customize colors, and preview dishes with zero credit card required.",
  },
  {
    question: "How do I get QR codes for my restaurant tables?",
    answer: "Your dashboard provides instant one-click downloads of high-resolution QR codes in both PNG and vector SVG formats. You can print them on table tents, acrylic stands, stickers, or bill folders.",
  },
  {
    question: "Are there any commissions or transaction fees on orders?",
    answer: "None. ZaaykaTech is a digital QR menu SaaS with a flat annual subscription of ₹2,999/year with manual renewal. We never take any percentage, cut, or commission from your restaurant sales.",
  },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredDishes = sampleDishes.filter((dish) => {
    const matchesCategory = selectedCategory === "All" || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Desktop Navigation (Top) */}
      <div className="hidden md:block">
        <NavBar items={desktopNavItems} />
      </div>

      {/* Mobile Navigation & Theme Toggle Wrapper */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex md:hidden items-center gap-3 w-fit pointer-events-none">
        <div className="pointer-events-auto">
          <PillBase />
        </div>
        <div className="bg-background/80 backdrop-blur-md rounded-full border border-border p-1 shadow-lg pointer-events-auto">
          <ModeToggle />
        </div>
      </div>

      <main className="flex-grow">
        {/* Section 1: Hero */}
        <AnimatedMarqueeHero
          tagline="THE FUTURE OF DINING IS HERE"
          title="Your restaurant’s digital menu. Managed in minutes."
          description="Create your QR menu, update dishes and prices, and manage everything from one simple dashboard."
          actions={
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                <Link
                  href="/login"
                  className="min-h-[56px] h-14 px-8 py-3.5 w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  Start free trial
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Link>
                <a
                  href="#preview"
                  className="min-h-[56px] h-14 px-6 py-3.5 w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border bg-card/60 backdrop-blur-sm text-foreground font-medium text-base hover:bg-accent/40 active:scale-[0.98] transition-all"
                >
                  See how it works
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Already an owner?{' '}
                <Link href="/login" className="font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                  Sign in to dashboard &rarr;
                </Link>
              </p>
            </div>
          }
          images={DEMO_IMAGES}
          imageLinks={DEMO_IMAGE_LINKS}
        />

        {/* Section 2: Actual Product & Menu Preview */}
        <section id="preview" className="py-20 md:py-28 bg-secondary/15 border-t border-border/50">
          <div id="demo" className="sr-only" aria-hidden="true" tabIndex={-1} />
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="outline" className="text-xs uppercase tracking-widest text-primary font-semibold mb-3 px-3 py-1">
                Live Interactive Preview
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                See ZaaykaTech in Action
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                Compare traditional paper menus to a responsive QR menu, and test our live interactive dining preview below.
              </p>
            </div>

            {/* Part A: Visual Comparison Slider */}
            <div className="mb-16">
              <FeatureWithImageComparison
                badge="Drag to Compare"
                title="Traditional Paper vs ZaaykaTech QR"
                description="Drag the slider to compare a worn, static physical menu with ZaaykaTech's clean, contactless mobile dining experience."
                beforeImage={{
                  src: "/desktop/menu.png",
                  alt: "Traditional paper menu at restaurant",
                }}
                afterImage={{
                  src: "/desktop/qr.png",
                  alt: "Modern digital QR menu on smartphone",
                }}
                beforeLabel="Traditional Paper"
                afterLabel="ZaaykaTech QR"
              />
            </div>

            {/* Part B: Interactive Phone Menu Mockup */}
            <div className="mt-12 bg-card rounded-3xl border border-border shadow-xl p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <Badge variant="secondary" className="text-xs">Guest View</Badge>
                  <h3 className="text-2xl md:text-3xl font-bold font-headline">
                    What Guests See on Their Phones
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Zero app downloads or registration required. Guests point their standard smartphone camera at the table QR code and instantly browse dishes, dietary indicators, and updated prices.
                  </p>
                  <ul className="space-y-2.5 text-sm text-foreground pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Instant search across all categories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Clear Veg / Non-Veg dietary badges</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Fast mobile loading with zero pinch-to-zoom</span>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/90 transition-all"
                    >
                      Create your digital menu
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Interactive Phone Frame Mockup */}
                <div className="lg:col-span-7">
                  <div className="max-w-md mx-auto rounded-3xl border-2 border-border/80 bg-background shadow-2xl overflow-hidden">
                    {/* Phone Header */}
                    <div className="bg-primary px-5 py-4 text-primary-foreground flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider opacity-80">Cafe 950</div>
                        <div className="text-base font-bold font-headline">Digital Dining Menu</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary-foreground/15 flex items-center justify-center text-xs font-bold">
                        QR
                      </div>
                    </div>

                    {/* Interactive Search Bar */}
                    <div className="p-4 border-b border-border/60 bg-muted/20">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search dishes, drinks..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-10 text-xs rounded-xl bg-background border-border"
                        />
                      </div>
                      {/* Category Chips */}
                      <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide text-xs">
                        {["All", "Mains", "Starters", "Breads", "Beverages"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                              selectedCategory === cat
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dish Items List */}
                    <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
                      {filteredDishes.length > 0 ? (
                        filteredDishes.map((dish) => (
                          <div
                            key={dish.name}
                            className="p-3.5 rounded-2xl border border-border/70 bg-card hover:bg-muted/10 transition-colors flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center shrink-0"
                                  title="Vegetarian"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                </span>
                                <h4 className="font-semibold text-xs text-foreground">{dish.name}</h4>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-snug">{dish.desc}</p>
                            </div>
                            <span className="font-bold text-xs text-foreground whitespace-nowrap">{dish.price}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-6">No matching dishes found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Practical Restaurant-Owner Benefits */}
        <WhyChooseZaaykaTech />

        {/* Section 4: Three-Step Setup Explanation */}
        <section id="how-it-works" className="py-20 md:py-28 bg-secondary/10 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="outline" className="text-xs uppercase tracking-widest text-primary font-semibold mb-3 px-3 py-1">
                Simple Setup
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                Live in 3 Simple Steps
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                No complex hardware or technical knowledge required. Get your digital QR menu up and running in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {setupSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="p-8 rounded-3xl border border-border bg-card shadow-lg flex flex-col justify-between relative group hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-3xl font-extrabold text-muted-foreground/30 font-headline group-hover:text-primary/40 transition-colors">
                          {step.step}
                        </span>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold font-headline mb-3 text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Start your 24-hour free trial
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 5: Verified Examples & Testimonials */}
        <section id="work" className="bg-background py-12">
          {/* Logo Cloud */}
          <div className="container mx-auto px-4 mb-12">
            <h3 className="text-center text-xs md:text-sm text-muted-foreground font-semibold tracking-[0.2em] uppercase mb-4">
              Trusted by Leading Cafes & Restaurants
            </h3>
            <div className="relative">
              <LogoCloud logos={restaurantLogos} />
            </div>
          </div>

          {/* Timeline of Real Restaurants */}
          <Timeline
            data={latestWorkData}
            title="Real Menus Powered by ZaaykaTech"
            description="Explore real dining destinations and cafes using ZaaykaTech digital menus to serve their guests."
          />
        </section>

        <section id="testimonials-section">
          <TestimonialsV2 />
        </section>

        {/* Section 6: Accurate Pricing */}
        <section id="pricing" className="py-20 md:py-28 bg-secondary/10 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Pricing</p>
              <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-muted-foreground text-base md:text-lg">
                One predictable annual fee of ₹2,999/yr. Zero order commissions. Free 24-hour trial starts immediately upon publishing with no card needed.
              </p>
            </div>
            <PricingCards />
          </div>
        </section>

        {/* Section 7: FAQ */}
        <section id="faq" className="py-20 md:py-28 bg-background border-t border-border/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-14">
              <Badge variant="outline" className="text-xs uppercase tracking-widest text-primary font-semibold mb-3 px-3 py-1">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-base md:text-lg">
                Everything you need to know about setting up and running your digital QR menu.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="rounded-2xl border border-border bg-card px-5 py-1 shadow-sm"
                >
                  <AccordionTrigger className="text-left font-semibold text-base md:text-lg hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pb-4 pt-1">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Section 8: Final CTA & Contact */}
        <section className="py-16 md:py-20 bg-secondary/15 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight">
              Ready to modernize your restaurant’s menu?
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              Start your 24-hour full-access free trial today. Build your digital menu, download print-ready QR codes, and see the difference.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/login"
                className="min-h-[52px] h-13 px-8 py-3.5 w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Start free trial
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
              <Link
                href="/login"
                className="min-h-[52px] h-13 px-6 py-3.5 w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border bg-card text-foreground font-medium text-base hover:bg-accent/40 transition-all active:scale-[0.98]"
              >
                Sign in to dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Inquiry Section */}
        <LetsWorkTogether />
      </main>
      <Footer />
    </div>
  );
}
