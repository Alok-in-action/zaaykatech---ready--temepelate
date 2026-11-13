import type { Metadata } from 'next';
import './globals.css';
import PWARegister from '../components/PWARegister';

export const metadata: Metadata = {
  title: 'ZaaykaTech — Next-Gen QR Menus for Restaurants',
  description: 'Turn any paper menu into a fast, fluid mobile QR experience in minutes. Built for restaurants, cafés, cloud kitchens, and food brands.',
  manifest: '/manifest.json',
  icons: {
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    title: 'ZaaykaTech',
    statusBarStyle: 'default',
  },
};

export const viewport = {
  themeColor: '#FAF8F5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#FAF8F5] text-stone-900 selection:bg-[#8B4A27]/20 selection:text-[#8B4A27] min-h-screen flex flex-col">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
