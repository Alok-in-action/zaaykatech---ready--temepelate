'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, UtensilsCrossed, QrCode, CreditCard } from 'lucide-react';

interface OwnerBottomNavProps {
  isOnboarding?: boolean;
}

export function OwnerBottomNav({ isOnboarding }: OwnerBottomNavProps) {
  const pathname = usePathname();

  // Hide the bottom navigation bar during onboarding
  if (isOnboarding || pathname === '/owner/onboarding') {
    return null;
  }

  const items = [
    {
      href: '/owner',
      label: 'Home',
      icon: Store,
      isActive: pathname === '/owner',
    },
    {
      href: '/owner/menu',
      label: 'My Menu',
      icon: UtensilsCrossed,
      isActive: pathname.startsWith('/owner/menu'),
    },
    {
      href: '/owner/qr',
      label: 'QR Code',
      icon: QrCode,
      isActive: pathname.startsWith('/owner/qr'),
    },
    {
      href: '/owner/billing',
      label: 'My Plan',
      icon: CreditCard,
      isActive: pathname.startsWith('/owner/billing'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 shadow-lg px-2 pt-1 transition-all"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-xl text-center transition-all active:scale-[0.97] touch-manipulation cursor-pointer ${
                item.isActive
                  ? 'text-[#8B4A27] font-bold bg-[#8B4A27]/8'
                  : 'text-stone-500 hover:text-stone-800 font-medium'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 transition-transform ${
                  item.isActive ? 'scale-110 text-[#8B4A27]' : 'text-stone-400'
                }`}
              />
              <span className="text-[11px] leading-tight tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
