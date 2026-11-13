import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', 'pdf-parse', 'tesseract.js'],
  async redirects() {
    return [
      {
        source: '/owner/menu/import',
        destination: '/owner/menu/ai-import',
        permanent: true,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
