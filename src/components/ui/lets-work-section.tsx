"use client";

import type React from "react";
import { useState } from "react";
import { ArrowUpRight, MessageCircle, Phone, Mail, CheckCircle2 } from "lucide-react";

export function LetsWorkTogether() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <section id="contact" className="flex min-h-[70vh] items-center justify-center px-6 py-20 bg-background overflow-hidden border-t border-border/50">
            <div className="relative flex flex-col items-center gap-10 w-full max-w-5xl text-center">
                
                {/* Live Availability Status */}
                <div className="flex items-center gap-3">
                    <span className="relative flex size-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-xs md:text-sm font-bold tracking-widest uppercase text-muted-foreground">
                        Ready to Onboard Your Restaurant
                    </span>
                </div>

                {/* Main Heading */}
                <div
                    className="group relative cursor-pointer"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="flex flex-col items-center gap-6">
                        <h2 className="relative text-center text-5xl font-bold font-headline tracking-tight text-foreground sm:text-7xl md:text-8xl transition-all duration-500">
                            <span className="block overflow-hidden pb-1">
                                <span
                                    className="block transition-transform duration-500"
                                    style={{
                                        transform: isHovered ? "translateY(-6%)" : "translateY(0)",
                                    }}
                                >
                                    Connect with us
                                </span>
                            </span>
                            <span className="block overflow-hidden">
                                <span
                                    className="block transition-transform duration-500 delay-75"
                                    style={{
                                        transform: isHovered ? "translateY(-6%)" : "translateY(0)",
                                    }}
                                >
                                    <span className="text-muted-foreground/50">today</span>
                                </span>
                            </span>
                        </h2>
                    </div>
                </div>

                <p className="max-w-xl text-base md:text-lg leading-relaxed text-muted-foreground font-normal">
                    Have questions about setting up your restaurant, multi-outlet pricing, or custom menu digitizing? Connect directly with our team.
                </p>

                {/* Verified Direct Contact Actions */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4 w-full max-w-2xl">
                    {/* WhatsApp Direct */}
                    <a
                        href="https://wa.me/917000703701?text=Hello%20ZaaykaTech%2C%20I%20am%20interested%20in%20a%20digital%20QR%20menu%20for%20my%20restaurant."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat on WhatsApp</span>
                        <ArrowUpRight className="w-4 h-4 opacity-70" />
                    </a>

                    {/* Phone Call */}
                    <a
                        href="tel:+917000703701"
                        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border border-border bg-card text-foreground font-semibold text-sm shadow-sm hover:bg-accent/40 active:scale-[0.98] transition-all"
                    >
                        <Phone className="w-4 h-4 text-primary" />
                        <span>Call +91 70007 03701</span>
                    </a>

                    {/* Email */}
                    <a
                        href="mailto:zaaykatech@gmail.com"
                        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border border-border bg-card text-foreground font-semibold text-sm shadow-sm hover:bg-accent/40 active:scale-[0.98] transition-all"
                    >
                        <Mail className="w-4 h-4 text-primary" />
                        <span>zaaykatech@gmail.com</span>
                    </a>
                </div>

                {/* Subtext info */}
                <div className="pt-2 text-xs text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Average response time: under 15 minutes during business hours</span>
                </div>
            </div>
        </section>
    );
}
