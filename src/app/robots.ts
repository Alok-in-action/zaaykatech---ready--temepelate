import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://zaaykatech.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/r/'],
        disallow: ['/owner/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
