import React from 'react';
import type { Metadata } from 'next';
import './marketing.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'ZaaykaTech — Next-Gen QR Menus for Restaurants',
  description:
    'Elevate your dining experience with smart, interactive QR menus and seamless mobile presence. ZaaykaTech helps you serve more customers, faster.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700;900&display=swap"
        rel="stylesheet"
      />
      <svg id="gooey-nav-svg" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <div className="marketing-root min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
          {children}
        </div>
      </ThemeProvider>
    </>
  );
}
