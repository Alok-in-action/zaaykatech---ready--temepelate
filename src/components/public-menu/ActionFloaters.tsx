'use client';

import React from 'react';
import { RestaurantContact, RestaurantSocialLinks, RestaurantAddress } from '@/types/database';
import { MessageSquare, Phone, MapPin, Instagram } from 'lucide-react';

interface ActionFloatersProps {
  contact: RestaurantContact;
  socialLinks: RestaurantSocialLinks;
  address: RestaurantAddress;
}

export function ActionFloaters({ contact, socialLinks, address }: ActionFloatersProps) {
  const hasPhone = Boolean(contact.phone);
  const hasWhatsApp = Boolean(contact.whatsapp);
  const hasMap = Boolean(address.google_maps_url);
  const hasInstagram = Boolean(socialLinks.instagram);

  if (!hasPhone && !hasWhatsApp && !hasMap && !hasInstagram) {
    return null;
  }

  const cleanPhone = contact.phone?.replace(/[^0-9+]/g, '');
  const cleanWhatsApp = contact.whatsapp?.replace(/[^0-9]/g, '');

  return (
    <aside
      aria-label="Restaurant quick contact actions"
      className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
    >
      <div className="bg-stone-900/90 backdrop-blur-xl text-white py-2 px-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-2 pointer-events-auto max-w-sm w-full justify-around">
        {hasWhatsApp && (
          <a
            href={`https://wa.me/${cleanWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 transition-all text-xs font-semibold apple-press"
            title="Chat on WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        )}

        {hasPhone && (
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-stone-800 text-stone-200 transition-all text-xs font-semibold apple-press"
            title="Call Restaurant"
          >
            <Phone className="w-3.5 h-3.5 text-stone-300" />
            <span>Call</span>
          </a>
        )}

        {hasMap && (
          <a
            href={address.google_maps_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-stone-800 text-stone-200 transition-all text-xs font-semibold apple-press"
            title="Get Directions"
          >
            <MapPin className="w-3.5 h-3.5 text-stone-300" />
            <span>Directions</span>
          </a>
        )}

        {hasInstagram && (
          <a
            href={socialLinks.instagram || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-pink-600/30 text-pink-400 hover:text-pink-300 transition-all text-xs font-semibold apple-press"
            title="Instagram"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </a>
        )}
      </div>
    </aside>
  );
}
