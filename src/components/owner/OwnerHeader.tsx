'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Restaurant } from '@/types/database';
import { setActiveRestaurantAction, signOutAction } from '@/actions/restaurant';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, ExternalLink, LogOut, Plus, Store } from 'lucide-react';

interface OwnerHeaderProps {
  userEmail?: string;
  restaurants: Restaurant[];
  activeRestaurant: Restaurant | null;
}

export function OwnerHeader({ userEmail, restaurants, activeRestaurant }: OwnerHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSelectRestaurant = async (restaurantId: string) => {
    if (!restaurantId || restaurantId === activeRestaurant?.id) return;
    try {
      setSwitching(true);
      const res = await setActiveRestaurantAction(restaurantId);
      if (res.success) {
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      await signOutAction();
      router.push('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { href: '/owner', label: 'Overview' },
    { href: '/owner/menu', label: 'Menu & Dishes' },
    { href: '/owner/onboarding', label: 'Setup Wizard' },
    { href: '/owner/branding', label: 'Branding & Theme' },
    { href: '/owner/qr', label: 'QR Code' },
    { href: '/owner/settings', label: 'Settings & Publish' },
    { href: '/owner/billing', label: 'Subscription' },
  ];

  return (
    <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Restaurant Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/owner" className="flex items-center gap-1.5 shrink-0">
            <span className="font-serif text-2xl font-black tracking-tight text-[#8B4A27]">
              Zaayka<span className="text-[#D2691E]">Tech</span>
            </span>
            <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Owner
            </span>
          </Link>

          {/* Restaurant Switcher */}
          {restaurants.length > 0 && activeRestaurant && (
            <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-stone-200">
              <div className="relative inline-flex items-center">
                <Store className="w-3.5 h-3.5 text-stone-400 mr-1.5 hidden sm:inline" />
                <select
                  value={activeRestaurant.id}
                  onChange={(e) => handleSelectRestaurant(e.target.value)}
                  disabled={switching}
                  className="bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 pr-7 appearance-none cursor-pointer hover:bg-stone-100 focus:outline-none focus:ring-1 focus:ring-[#8B4A27]"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.slug})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-stone-500 absolute right-2 pointer-events-none" />
              </div>

              {activeRestaurant.status === 'published' ? (
                <a
                  href={`/r/${activeRestaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1 text-[11px] text-[#8B4A27] hover:underline font-medium"
                >
                  <span>Public View</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="hidden md:inline text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-medium border border-amber-200">
                  Draft
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/owner/onboarding"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-all"
            title="Create another restaurant"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Restaurant</span>
          </Link>

          {activeRestaurant && (
            <Link
              href="/owner/billing"
              className="px-3 py-1.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              Subscription
            </Link>
          )}

          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 text-xs font-medium rounded-xl transition-all"
            title={userEmail ? `Signed in as ${userEmail} (Click to log out)` : 'Sign Out'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* Subnavigation Tabs */}
      <nav className="border-t border-stone-100 bg-stone-50/50 overflow-x-auto no-scrollbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 py-1.5 text-xs font-medium">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/owner'
                ? pathname === '/owner'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#8B4A27] text-white font-semibold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
