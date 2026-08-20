import type { NextConfig } from 'next';

const API_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:7821/v1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'komtru-assets.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'cdn.komtru.com' },
      { protocol: 'https', hostname: 'avatars.komtru.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  /**
   * There is no public surface on this app — it is the internal operations
   * console. Done here rather than in a root `page.tsx` so `/` answers with a
   * real 307 instead of a rendered shell that redirects after hydration.
   */
  async redirects() {
    return [{ source: '/', destination: '/dashboard', permanent: false }];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
