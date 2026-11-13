import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://zaaykatech.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/r/demo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    const hasRealSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    );

    if (hasRealSupabase) {
      const supabase = createServiceClient();
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('slug, updated_at')
        .eq('status', 'published')
        .limit(100);

      if (restaurants && restaurants.length > 0) {
        const dynamicRoutes: MetadataRoute.Sitemap = restaurants.map((r) => ({
          url: `${baseUrl}/r/${r.slug}`,
          lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        }));
        return [...staticRoutes, ...dynamicRoutes];
      }
    }
  } catch (err) {
    console.warn('Could not generate dynamic sitemap routes:', err);
  }

  return staticRoutes;
}
