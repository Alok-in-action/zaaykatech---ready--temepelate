'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Restaurant } from '@/types/database';
import { setActiveRestaurantAction, signOutAction } from '@/actions/restaurant';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, ExternalLink, LogOut, Plus, Store, Sparkles, ChefHat, MessageSquare, Loader2 } from 'lucide-react';

interface OwnerHeaderProps {
  userEmail?: string;
  restaurants?: Restaurant[];
  activeRestaurant: Restaurant | null;
  isOnboarding?: boolean;
}

export function OwnerHeader({ userEmail, activeRestaurant, isOnboarding }: OwnerHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActuallyOnboarding =
    isOnboarding ||
    pathname === '/owner/onboarding' ||
    !activeRestaurant ||
    activeRestaurant.onboarding_status !== 'completed';

  const handleSignOut = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      await signOutAction();
      // Hard navigation flushes client cache and guarantees clean logged-out state
      window.location.href = '/login';
    } catch (e) {
      console.warn('Sign out error:', e);
      window.location.href = '/login';
    }
  };

  const navLinks = [
    { href: '/owner', label: 'Overview' },
    { href: '/owner/menu', label: 'Menu & Dishes' },
    { href: '/owner/branding', label: 'Branding & Theme' },
    { href: '/owner/qr', label: 'QR Code' },
    { href: '/owner/settings', label: 'Settings & Publish' },
    { href: '/owner/billing', label: 'Subscription' },
  ];

  // If onboarding is in progress, hide tabs and show only Logo, WhatsApp Help, and Sign Out
  if (isActuallyOnboarding) {
    return (
      <header className="apple-glass sticky top-0 z-30 transition-all border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/owner" className="flex items-center gap-1.5 shrink-0 group">
            <span className="font-headline text-2xl font-black tracking-tight text-neutral-900 transition-transform duration-200 group-hover:scale-[1.02]">
              Zaayka<span className="text-neutral-500">Tech</span>
            </span>
            <span className="text-[10px] bg-neutral-100 text-neutral-800 border border-neutral-200/80 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Owner
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://wa.me/919999999999?text=Hello%20ZaaykaTech%20support%2C%20I%20need%20help%20with%20restaurant%20onboarding"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl shadow-xs transition-all apple-press"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Need help? WhatsApp</span>
            </a>

            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              aria-label="Sign out"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              title={userEmail ? `Signed in as ${userEmail} (Click to log out)` : 'Sign Out'}
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="apple-glass sticky top-0 z-30 transition-all border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Active Restaurant */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/owner" className="flex items-center gap-1.5 shrink-0 group">
            <span className="font-headline text-2xl font-black tracking-tight text-neutral-900 transition-transform duration-200 group-hover:scale-[1.02]">
              Zaayka<span className="text-neutral-500">Tech</span>
            </span>
            <span className="text-[10px] bg-neutral-100 text-neutral-800 border border-neutral-200/80 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Owner
            </span>
          </Link>

          {/* Active Single Restaurant Identity */}
          {activeRestaurant && (
            <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-neutral-200/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                <Store className="w-3.5 h-3.5 text-neutral-600" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate">{activeRestaurant.name}</span>
              </div>

              {activeRestaurant.status === 'published' ? (
                <a
                  href={`/r/${activeRestaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1 text-[11px] text-neutral-900 hover:underline font-semibold"
                >
                  <span>Public Menu</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="hidden md:inline text-[10px] bg-amber-500/10 text-amber-800 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">
                  Draft
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {activeRestaurant ? (
            <Link
              href="/owner/billing"
              className="px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Subscription
            </Link>
          ) : (
            <Link
              href="/owner/onboarding"
              className="px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Start Onboarding
            </Link>
          )}

          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            aria-label="Sign out"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            title={userEmail ? `Signed in as ${userEmail} (Click to log out)` : 'Sign Out'}
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* Desktop Subnavigation Tabs (Hidden on mobile; mobile uses bottom tab bar) */}
      <nav className="hidden md:block border-t border-neutral-200/60 bg-white/40 backdrop-blur-md overflow-x-auto no-scrollbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-1.5 py-1.5 text-xs font-medium">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/owner'
                ? pathname === '/owner'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-xs ${
                  isActive
                    ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
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
