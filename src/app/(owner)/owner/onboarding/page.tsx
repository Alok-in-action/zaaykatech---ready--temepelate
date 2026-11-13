import React from 'react';
import { redirect } from 'next/navigation';
import { getOwnerLifecycle } from '@/lib/owner-lifecycle';
import { getOwnerMenuData } from '@/actions/restaurant';
import { OnboardingWizard } from '@/components/owner/OnboardingWizard';
import { MenuCategory, MenuItem } from '@/types/database';

interface OnboardingPageProps {
  searchParams?: Promise<{ edit?: string; fresh?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isExplicitEdit = resolvedSearchParams.edit === 'true';
  const isFreshPublish = resolvedSearchParams.fresh === 'true';

  const lifecycle = await getOwnerLifecycle();

  if (lifecycle.state === 'error') {
    throw new Error(lifecycle.error || 'Temporary database error retrieving restaurant. Please refresh to retry.');
  }

  // If the owner has already completed and published (or offline), send them directly to dashboard
  // unless they explicitly requested edit mode (?edit=true) or fresh publish confirmation (?fresh=true)
  if (
    !isExplicitEdit &&
    !isFreshPublish &&
    lifecycle.restaurant &&
    (lifecycle.restaurant.onboarding_status === 'completed' || lifecycle.state === 'offline')
  ) {
    redirect('/owner');
  }

  let categories: MenuCategory[] = [];
  let items: MenuItem[] = [];

  if (lifecycle.restaurant) {
    const menuRes = await getOwnerMenuData(lifecycle.restaurant.id);
    if (menuRes.success) {
      categories = menuRes.categories;
      items = menuRes.items;
    }
  }

  return (
    <div className="py-4 max-w-4xl mx-auto">
      <OnboardingWizard
        initialRestaurant={lifecycle.restaurant}
        initialStep={isFreshPublish ? 5 : isExplicitEdit ? 1 : lifecycle.step || 1}
        initialCategories={categories}
        initialItems={items}
        isFreshPublish={isFreshPublish}
      />
    </div>
  );
}
