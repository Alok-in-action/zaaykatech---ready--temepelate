'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Restaurant } from '@/types/database';

interface HeroBannerProps {
  restaurant: Restaurant;
}

export function HeroBanner({ restaurant }: HeroBannerProps) {
  const { branding, name, address, social_links } = restaurant;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

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
    <header className="relative w-full overflow-hidden bg-stone-900 text-white rounded-b-3xl shadow-lg">
      {/* Background Media */}
      <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden">
        {branding.hero_media_type === 'video' && branding.hero_media_url ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={branding.hero_media_url}
              poster={branding.hero_poster_url || undefined}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-60"
            />
            <button
              onClick={togglePlay}
              type="button"
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all text-xs"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>
        ) : branding.hero_media_url || branding.hero_poster_url ? (
          <Image
            src={branding.hero_media_url || branding.hero_poster_url || ''}
            alt={name}
            fill
            priority
            className="object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#8B4A27] via-[#5c3018] to-stone-950" />
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
      </div>

      {/* Content Info Container */}
      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-10 flex flex-col justify-end">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            {branding.logo_url && (
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden mb-2 border-2 border-white/40 shadow-md">
                <Image src={branding.logo_url} alt={`${name} logo`} fill className="object-cover" />
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
                <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {address.street ? `${address.street}, ` : ''}
                  {address.city}
                </span>
              </div>
            )}
          </div>

          {social_links?.google_review && (
            <a
              href={social_links.google_review}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-amber-400/20 backdrop-blur-md border border-amber-400/30 text-amber-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-amber-400/30 transition-all flex-shrink-0"
            >
              <span>★</span>
              <span>Review Us</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

