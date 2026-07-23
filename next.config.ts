import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/pricing',
        destination: '/features',
        permanent: true,
      },
    ];
  },
  // ignore ts errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // ignore eslint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
