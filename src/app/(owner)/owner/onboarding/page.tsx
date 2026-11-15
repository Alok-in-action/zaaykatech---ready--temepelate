import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPlatformAdminAllowlist } from '@/lib/admin/auth';
import { getOwnerLifecycle } from '@/lib/owner-lifecycle';
import { getOwnerMenuData } from '@/actions/restaurant';
import { OnboardingWizard } from '@/components/owner/OnboardingWizard';
import { MenuCategory, MenuItem } from '@/types/database';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingPageProps {
  searchParams?: Promise<{ edit?: string; fresh?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isExplicitEdit = resolvedSearchParams.edit === 'true';
  const isFreshPublish = resolvedSearchParams.fresh === 'true';

  // Guard: Allowlisted platform admins must land on /admin and never be forced into onboarding
  const adminAllowlist = getPlatformAdminAllowlist();
  if (adminAllowlist.length > 0) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && adminAllowlist.includes(user.id.toLowerCase())) {
      redirect('/admin');
    }
  }

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
    if (!menuRes.success) {
      // Menu load failure: do NOT masquerade as an empty menu
      return (
        <div className="py-12 max-w-lg mx-auto text-center space-y-4 px-4">
          <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-destructive/10 mx-auto flex items-center justify-center text-destructive">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Failed to load menu data</h2>
            <p className="text-sm opacity-90 text-muted-foreground">
              {menuRes.error || 'A temporary error occurred while retrieving your categories and dishes from the database.'}
            </p>
            <div className="pt-2">
              <Link href="/owner/onboarding">
                <Button variant="default" className="flex items-center gap-2 mx-auto">
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
    categories = menuRes.categories;
    items = menuRes.items;
  }

  // Requirement 8: If the minimum valid category/item requirement is already satisfied (>= 1 category and >= 1 item),
  // resume at Review (step 4 / sub-step '4a') instead of asking for a first category or dish.
  const hasMinimumMenu = categories.length >= 1 && items.length >= 1;
  const currentStep = lifecycle.restaurant?.onboarding_current_step || lifecycle.step || 1;

  let resolvedStep = isFreshPublish ? 5 : isExplicitEdit ? 1 : currentStep;
  if (!isFreshPublish && !isExplicitEdit && hasMinimumMenu && (resolvedStep === 3 || resolvedStep === 31 || resolvedStep === 32 || resolvedStep === 33)) {
    resolvedStep = 41; // Resume at Review
  }

  return (
    <div className="py-4 max-w-4xl mx-auto">
      <OnboardingWizard
        initialRestaurant={lifecycle.restaurant}
        initialStep={resolvedStep}
        initialCategories={categories}
        initialItems={items}
        isFreshPublish={isFreshPublish}
      />
    </div>
  );
}
