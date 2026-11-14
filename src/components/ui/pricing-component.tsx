"use client";
import { useState } from "react";
import { Calendar, Check, Zap, Star, Layout, ShoppingCart } from "lucide-react";

const CheckIcon = ({ dark = false }: { dark?: boolean }) => (
    <span
        className={[
            "inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0",
            dark ? "bg-white/10 text-white" : "bg-neutral-900 text-white",
        ].join(" ")}
    >
        <Check className="w-3 h-3" strokeWidth={2.5} />
    </span>
);

export default function PricingCards() {
    const trialFeatures = [
        "24-hour full-access free trial",
        "Instant setup with AI & CSV menu import",
        "Complete digital menu preview",
        "High-resolution QR code generator",
        "Custom colors, logo & branding",
        "Mobile-optimized menu website",
        "No credit card required upfront",
    ];

    const proFeatures = [
        "Everything in Free Trial +",
        "365 days live menu hosting",
        "Unlimited categories & food items",
        "Unlimited instant menu edits",
        "Print-ready QR downloads (PNG & SVG)",
        "Fast global CDN media storage",
        "Zero recurring deductions (Manual renewal)",
    ];

    const enterpriseFeatures = [
        "Multi-outlet chain management",
        "Dedicated QR menu per location",
        "Bulk menu digitization & catalog setup",
        "Custom branding & priority support",
        "Staff onboarding assistance",
        "Direct manager phone & WhatsApp support",
    ];

    return (
        <div className="w-full space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-[1200px] mx-auto">
                {/* Free Trial Card */}
                <div className="rounded-3xl p-1.5 md:p-2 bg-white/65 backdrop-blur-md border border-neutral-200/70 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-inset ring-white/40 flex flex-col h-full">
                    <div className="rounded-2xl p-6 md:p-8 mb-2 bg-white/80 backdrop-blur-sm border border-neutral-200/80 ring-1 ring-inset ring-neutral-900/5 flex-grow">
                        <div className="mb-6 flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 block">Free Trial</h2>
                                <p className="text-neutral-600 text-sm md:text-base leading-relaxed mt-1">
                                    Full Access Test Drive
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/70 px-2 md:px-3 py-1 text-[10px] md:text-xs font-medium text-neutral-700 backdrop-blur whitespace-nowrap">
                                <Zap className="w-3 h-3" /> 24 Hours
                            </span>
                        </div>

                        <div className="flex items-baseline mb-8">
                            <span className="text-4xl md:text-5xl font-bold tracking-tighter text-neutral-900">₹0</span>
                            <span className="text-neutral-400 text-base md:text-lg ml-2">/24 hours</span>
                        </div>

                        <a
                            href="/login"
                            className="w-full rounded-xl font-semibold text-sm md:text-base py-3 md:py-4 bg-neutral-900 text-white hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-neutral-900/10"
                        >
                            Start Free Trial
                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-neutral-300" />
                        </a>
                    </div>

                    <div className="px-5 md:px-6 pb-5 md:pb-6 pt-3 md:pt-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-neutral-200/70 ring-1 ring-inset ring-white/30">
                        <div className="grid grid-cols-1 gap-y-2.5 md:gap-y-3">
                            {trialFeatures.map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <CheckIcon />
                                    <span className="text-neutral-800 text-xs md:text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Yearly Pro Plan - Server Verified ₹2,999/yr */}
                <div className="rounded-3xl p-1.5 md:p-2 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 shadow-[0_12px_50px_-15px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/5 flex flex-col h-full md:transform md:scale-105 z-10">
                    <div className="rounded-2xl p-6 md:p-8 mb-2 bg-neutral-900/70 backdrop-blur-sm border border-neutral-800 ring-1 ring-inset ring-white/10 flex-grow">
                        <div className="mb-6 flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-5 block">Yearly Pro</h2>
                                <p className="text-neutral-400 text-xs md:text-base leading-relaxed mt-1">
                                    Complete QR Menu System
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 md:px-3 py-1 text-[10px] md:text-xs font-medium text-amber-400 backdrop-blur whitespace-nowrap">
                                <Star className="w-3 h-3 fill-amber-400" /> Most Popular
                            </span>
                        </div>

                        <div className="flex items-baseline mb-2">
                            <span className="text-4xl md:text-5xl font-bold tracking-tighter text-white">₹2,999</span>
                            <span className="text-neutral-500 text-base md:text-lg ml-2">/year</span>
                        </div>
                        <p className="text-amber-400 text-[10px] md:text-xs mb-6 font-bold uppercase tracking-wider">Perfect for cafés &amp; restaurants ⭐</p>

                        <a
                            href="/login"
                            className="w-full rounded-xl font-semibold text-sm md:text-base py-3 md:py-4 bg-white text-neutral-900 hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_18px_-6px_rgba(255,255,255,0.35)] ring-1 ring-inset ring-white/30"
                        >
                            Get Started Today
                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
                        </a>
                    </div>

                    <div className="px-5 md:px-6 pb-5 md:pb-6 pt-3 md:pt-4 bg-neutral-900/55 backdrop-blur-sm rounded-2xl border border-neutral-800 ring-1 ring-inset ring-white/10">
                        <div className="grid grid-cols-1 gap-y-2.5 md:gap-y-3">
                            {proFeatures.map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <CheckIcon dark />
                                    <span className="text-neutral-300 text-xs md:text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Multi-Outlet / Chain Card */}
                <div className="rounded-3xl p-1.5 md:p-2 bg-white/65 backdrop-blur-md border border-neutral-200/70 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-inset ring-white/40 flex flex-col h-full">
                    <div className="rounded-2xl p-6 md:p-8 mb-2 bg-white/80 backdrop-blur-sm border border-neutral-200/80 ring-1 ring-inset ring-neutral-900/5 flex-grow">
                        <div className="mb-6 flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 block">Chains</h2>
                                <p className="text-neutral-600 text-xs md:text-base leading-relaxed mt-1 font-semibold text-indigo-600">
                                    Multi-Outlet &amp; Custom Setup
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold text-indigo-600 backdrop-blur whitespace-nowrap">
                                <Layout className="w-3 h-3" /> Enterprise
                            </span>
                        </div>

                        <div className="flex items-baseline mb-2">
                            <span className="text-4xl md:text-5xl font-bold tracking-tighter text-neutral-900">Custom</span>
                            <span className="text-neutral-400 text-base md:text-lg ml-2">/quote</span>
                        </div>
                        <p className="text-indigo-600 text-[10px] md:text-xs mb-6 font-bold uppercase italic leading-tight">
                            "Tailored onboarding &amp; dedicated menu digitization for restaurant groups" 🚀
                        </p>

                        <a
                            href="/#contact"
                            className="w-full rounded-xl font-semibold text-base py-4 bg-neutral-800 text-white hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-neutral-900/10"
                        >
                            Contact Our Team
                            <Zap className="w-5 h-5 text-indigo-300" />
                        </a>
                    </div>

                    <div className="px-6 pb-6 pt-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-neutral-200/70 ring-1 ring-inset ring-white/30">
                        <div className="grid grid-cols-1 gap-y-3">
                            {enterpriseFeatures.map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <CheckIcon />
                                    <span className="text-neutral-800 text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-center text-xs text-neutral-500 mt-8">
                Instant activation via UPI, Cards, NetBanking (Razorpay). <a href="/#contact" className="underline font-medium hover:text-neutral-900 transition-colors">Contact us</a> for multi-outlet inquiries.
            </p>
        </div>
    );
}
