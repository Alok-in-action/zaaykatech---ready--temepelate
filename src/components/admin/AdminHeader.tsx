'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  HardDrive,
  FileScan,
  Shield,
  Activity,
  RefreshCw,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signOutAction } from '@/actions/restaurant';

interface AdminHeaderProps {
  userEmail?: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
    { href: '/admin/payments', label: 'Payments & Subs', icon: CreditCard },
    { href: '/admin/storage', label: 'Storage & DB', icon: HardDrive },
    { href: '/admin/imports', label: 'OCR & Imports', icon: FileScan },
    { href: '/admin/security', label: 'Security & Limits', icon: Shield },
    { href: '/admin/health', label: 'System Health', icon: Activity },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
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

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-black tracking-tight text-stone-900 transition-transform group-hover:scale-[1.01]">
              Zaayka<span className="text-stone-500 font-sans font-normal">Tech</span>
            </span>
            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300/90 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Platform Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick link to Owner Dashboard */}
          <Link
            href="/owner"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-50 transition-colors"
          >
            Owner View <ExternalLink className="w-3 h-3 text-stone-400" />
          </Link>

          {/* Manual Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-medium hover:bg-stone-200/80 transition-colors disabled:opacity-50"
            title="Refresh authoritative metrics from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* User & Sign Out */}
          <div className="flex items-center gap-2 border-l border-stone-200 pl-3 sm:pl-4">
            {userEmail && (
              <span className="text-xs font-mono text-stone-500 hidden md:inline truncate max-w-[180px]">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-medium transition-colors"
              title="Sign out of platform admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 text-xs font-medium text-stone-600">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#4338CA] text-white font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
