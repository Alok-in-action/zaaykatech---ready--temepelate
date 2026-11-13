import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '../components/PWARegister';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://zaaykatech.com'),
  title: {
    default: 'ZaaykaTech — Next-Gen QR Menus for Restaurants',
    template: '%s | ZaaykaTech',
  },
  description:
    'Turn any paper menu into a fast, fluid mobile QR experience in minutes. Built for restaurants, cafés, cloud kitchens, and food brands.',
  keywords: [
    'QR menu',
    'restaurant menu',
    'digital menu',
    'contactless dining',
    'cafe QR code',
    'food menu online',
    'AI menu maker',
  ],
  authors: [{ name: 'ZaaykaTech Team', url: 'https://zaaykatech.com' }],
  creator: 'ZaaykaTech',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://zaaykatech.com',
    siteName: 'ZaaykaTech',
    title: 'ZaaykaTech — Next-Gen QR Menus for Restaurants',
    description:
      'Turn any paper menu into a fast, fluid mobile QR experience in minutes. Built for restaurants, cafés, cloud kitchens, and food brands.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'ZaaykaTech Digital QR Menu Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZaaykaTech — Next-Gen QR Menus for Restaurants',
    description:
      'Turn any paper menu into a fast, fluid mobile QR experience in minutes.',
    images: ['/logo.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    title: 'ZaaykaTech',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#FAF8F5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased bg-[#FAF8F5] text-stone-900 selection:bg-[#8B4A27]/20 selection:text-[#8B4A27] min-h-screen flex flex-col">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
