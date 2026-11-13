'use client';

import React, { useState } from 'react';
import { OnboardingWizard } from '@/components/owner/OnboardingWizard';
import { Restaurant } from '@/types/database';

export default function TestMobileOnboardingPage() {
  const [createdRestaurant, setCreatedRestaurant] = useState<Restaurant | null>(null);

  const mockCreateRestaurant = async (input: { name: string; onboarding_current_step: number }) => {
    const mock: Restaurant = {
      id: 'mock-restaurant-id',
      owner_profile_id: 'mock-owner-id',
      name: input.name,
      slug: 'mock-restaurant',
      status: 'draft',
      site_status: 'trialing',
      food_type: null,
      agent_id: null,
      onboarding_completed_at: null,
      social_links: { instagram: null, facebook: null, google_review: null },
      contact: { phone: '', email: 'owner@example.com', whatsapp: null },
      address: { city: '', street: '', state: '', pincode: '', google_maps_url: null },
      branding: {
        logo_url: null,
        hero_media_type: 'image',
        hero_media_url: null,
        hero_poster_url: null,
        tagline: '',
      },
      theme: {
        primary_color: '#8B4A27',
        accent_color: '#D95B16',
        background_color: '#FAF8F5',
        card_style: 'warm_editorial',
      },
      onboarding_current_step: input.onboarding_current_step,
      onboarding_status: 'in_progress',
      trial_ends_at: null,
      subscription_end_date: null,
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
      onboarding_source: 'self_serve',
    };
    setCreatedRestaurant(mock);
    return { success: true, restaurant: mock };
  };

  const mockSaveStep = async (restaurantId: string, step: number, data: any) => {
    if (createdRestaurant) {
      setCreatedRestaurant((prev) => (prev ? { ...prev, ...data, onboarding_current_step: step } : null));
    }
    return { success: true };
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="py-2 max-w-4xl mx-auto px-0">
        <OnboardingWizard
          initialRestaurant={createdRestaurant}
          initialStep={1}
          initialCategories={[]}
          initialItems={[]}
          onCreateRestaurant={mockCreateRestaurant}
          onSaveStep={mockSaveStep}
        />
      </div>
    </div>
  );
}
