import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveTenantBySlug } from '@/lib/tenant/resolver';
import PublicMenu from '@/components/public-menu/PublicMenu';
import ExpiredNotice from '@/components/public-menu/ExpiredNotice';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenantData = await resolveTenantBySlug(slug);

  if (!tenantData) {
    return {
      title: 'Restaurant Not Found | ZaaykaTech',
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
      index: true,
      follow: true,
    },
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const tenantData = await resolveTenantBySlug(slug);

  if (!tenantData) {
    notFound();
  }

  // If trial or subscription is expired and beyond grace period
  if (!tenantData.isLive) {
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

