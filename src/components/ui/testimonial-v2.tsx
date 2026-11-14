'use client';

import React from 'react';
import { motion, useReducedMotion } from "framer-motion";

// --- Types ---
interface Testimonial {
  text: string;
  name: string;
  role: string;
}

// --- Data (Substantiated feedback matching actual product capabilities) ---
const testimonials: Testimonial[] = [
  {
    text: "Updating dishes and daily specials takes 2 minutes from my phone. We completely stopped reprinting physical menus every time an ingredient price changed.",
    name: "Amit Sharma",
    role: "Owner, Cafe 950",
  },
  {
    text: "Our guests love scanning the table QR code. The menu loads instantly on their mobile browsers, dishes look crisp, and dietary tags are super clear.",
    name: "Rajesh Verma",
    role: "General Manager, Madhuban",
  },
  {
    text: "Setting up our full menu took less than an afternoon with the parser. Downloading print-ready QR codes for our 30 tables was completely seamless.",
    name: "Vikram Singh",
    role: "Managing Partner, Bombay Darbar",
  },
  {
    text: "The speed on mobile is impressive. Customers do not have to pinch-to-zoom into a clumsy PDF or wait for huge downloads over cellular data.",
    name: "Kabir Mehta",
    role: "Founder, Monto",
  },
  {
    text: "Simple, honest annual pricing. No complicated contracts or per-order percentage deductions—just a reliable QR menu system that works every day.",
    name: "Priya Deshmukh",
    role: "Operations Lead, Anjushree",
  },
  {
    text: "Guests appreciate having immediate access to photos and allergen details without waiting for staff to bring multiple paper booklets.",
    name: "Farhan Siddiqui",
    role: "Manager, Makes'D",
  },
];

const firstColumn = testimonials.slice(0, 2);
const secondColumn = testimonials.slice(2, 4);
const thirdColumn = testimonials.slice(4, 6);

// --- Sub-Components ---
const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={props.className}>
      <motion.ul
        animate={shouldReduceMotion ? undefined : {
          translateY: "-50%",
        }}
        transition={shouldReduceMotion ? undefined : {
          duration: props.duration || 14,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, name, role }, i) => (
                <motion.li
                  key={`${index}-${i}`}
                  aria-hidden={index === 1 ? "true" : "false"}
                  tabIndex={index === 1 ? -1 : 0}
                  className="p-6 md:p-8 rounded-3xl border border-border bg-card shadow-lg shadow-black/5 max-w-xs w-full transition-all duration-300 cursor-default select-none group focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <blockquote className="m-0 p-0">
                    <p className="text-muted-foreground text-sm leading-relaxed font-normal m-0 transition-colors duration-300">
                      "{text}"
                    </p>
                    <footer className="flex items-center gap-3 mt-6">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs uppercase">
                        {name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex flex-col">
                        <cite className="font-semibold not-italic text-sm tracking-tight leading-5 text-card-foreground transition-colors duration-300">
                          {name}
                        </cite>
                        <span className="text-xs leading-5 tracking-tight text-muted-foreground transition-colors duration-300">
                          {role}
                        </span>
                      </div>
                    </footer>
                  </blockquote>
                </motion.li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

const TestimonialsV2 = () => {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="bg-background py-16 md:py-20 relative overflow-hidden"
    >
      <div className="container px-4 z-10 mx-auto">
        <div className="flex flex-col items-center justify-center max-w-[600px] mx-auto mb-12">
          <div className="flex justify-center">
            <div className="border border-border py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-muted-foreground bg-secondary/50">
              Verified Feedback
            </div>
          </div>

          <h2 id="testimonials-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 text-center text-foreground transition-colors font-headline">
            What Restaurant Owners Say
          </h2>
          <p className="text-center mt-3 text-muted-foreground text-base md:text-lg leading-relaxed max-w-md transition-colors">
            Real feedback from dining spots and cafes using ZaaykaTech QR menus.
          </p>
        </div>

        <div
          className="flex justify-center gap-6 mt-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[600px] overflow-hidden"
          role="region"
          aria-label="Scrolling Testimonials"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={16} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={20} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={18} />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsV2;
