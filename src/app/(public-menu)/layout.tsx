import React from 'react';
import Script from 'next/script';
import './public-menu.css';

export default function PublicMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-menu-root min-h-screen">
      {/* Preconnect & Google Fonts strictly loaded for public menu with display=swap */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@200;300;400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
        rel="stylesheet"
      />
      {/* Iconify Web Component Script for public menu icons */}
      <Script
        src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"
        strategy="afterInteractive"
      />
      {children}
    </div>
  );
}
