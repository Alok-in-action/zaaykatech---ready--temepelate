'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Restaurant } from '@/types/database';
import { Pause, Play, MapPin } from 'lucide-react';

interface HeroBannerProps {
  restaurant: Restaurant;
}

export function HeroBanner({ restaurant }: HeroBannerProps) {
  const { branding, name, address } = restaurant;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [canLoadVideo, setCanLoadVideo] = useState(false);

  // 1. Defer video loading so it NEVER blocks initial render or LCP
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setIsPlaying(false);
        return;
      }

      // Defer video stream request until critical rendering has settled
      const timer = setTimeout(() => {
        setCanLoadVideo(true);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <header className="relative w-full overflow-hidden bg-stone-950 text-white rounded-b-3xl shadow-md">
      {/* Background Media */}
      <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden">
        {/* If video hero is configured */}
        {branding.hero_media_type === 'video' && branding.hero_media_url ? (
          <div className="relative w-full h-full">
            {/* 1. Instant Next.js Priority Poster Image */}
            {branding.hero_poster_url && (
              <Image
                src={branding.hero_poster_url}
                alt={`${name} poster`}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 640px"
                className={`object-cover transition-opacity duration-700 ${
                  videoLoaded ? 'opacity-0' : 'opacity-60'
                }`}
              />
            )}

            {/* 2. Lazy Non-Blocking HTML5 Video */}
            {canLoadVideo && (
              <video
                ref={videoRef}
                src={branding.hero_media_url}
                poster={branding.hero_poster_url || undefined}
                preload="none"
                autoPlay
                loop
                muted
                playsInline
                onPlaying={() => setVideoLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-700 ${
                  videoLoaded ? 'opacity-60' : 'opacity-0'
                }`}
              />
            )}

            <button
              onClick={togglePlay}
              type="button"
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full apple-glass flex items-center justify-center text-white/90 hover:text-white transition-all apple-press shadow-xs"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          </div>
        ) : branding.hero_media_url || branding.hero_poster_url ? (
          <Image
            src={branding.hero_media_url || branding.hero_poster_url || ''}
            alt={name}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#8B4A27] via-[#5c3018] to-stone-950" />
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
      </div>

      {/* Content Info Container */}
      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-10 flex flex-col justify-end">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            {branding.logo_url && (
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden mb-2.5 border-2 border-white/40 shadow-md">
                <Image
                  src={branding.logo_url}
                  alt={`${name} logo`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              {name}
            </h1>
            {branding.tagline && (
              <p className="text-xs sm:text-sm text-stone-300 mt-1 line-clamp-2 font-sans font-light">
                {branding.tagline}
              </p>
            )}
            {address?.city && (
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {address.street ? `${address.street}, ` : ''}
                  {address.city}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
