import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { resolveTenantBySlug } from '@/lib/tenant/resolver';
import PublicMenu from '@/components/public-menu/PublicMenu';
import ExpiredNotice from '@/components/public-menu/ExpiredNotice';

// Request-memoized tenant resolver for per-request deduplication between generateMetadata and Page
const getCachedTenantBySlug = cache(async (slug: string) => resolveTenantBySlug(slug));

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenantData = await getCachedTenantBySlug(slug);

  if (!tenantData || !tenantData.restaurant) {
    return {
      title: 'Restaurant Not Found | ZaaykaTech',
      description: 'The requested digital restaurant menu could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const { restaurant } = tenantData;
  const title = `${restaurant.name} - Digital QR Menu`;
  const description =
    restaurant.branding?.tagline || `Explore the fresh, delicious menu of ${restaurant.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: restaurant.branding?.hero_poster_url
        ? [{ url: restaurant.branding.hero_poster_url }]
        : undefined,
    },
    robots: {
      index: tenantData.isLive,
      follow: tenantData.isLive,
    },
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const tenantData = await getCachedTenantBySlug(slug);

  // If restaurant doesn't exist, or is in draft/preview/suspended mode -> return 404
  if (!tenantData) {
    notFound();
  }

  // If restaurant trial or subscription has expired or is payment overdue -> show polite offline notice
  if (tenantData.showExpiredNotice || !tenantData.isLive) {
    return <ExpiredNotice restaurantName={tenantData.restaurant.name} />;
  }

  // Schema.org Restaurant Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: tenantData.restaurant.name,
    description: tenantData.restaurant.branding?.tagline,
    telephone: tenantData.restaurant.contact?.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: tenantData.restaurant.address?.street,
      addressLocality: tenantData.restaurant.address?.city,
      addressRegion: tenantData.restaurant.address?.state,
      postalCode: tenantData.restaurant.address?.pincode,
      addressCountry: 'IN',
    },
    menu: `https://zaaykatech.com/r/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicMenu
        restaurant={tenantData.restaurant}
        categories={tenantData.categories}
        items={tenantData.items}
      />
    </>
  );
}
