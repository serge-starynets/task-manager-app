import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  async redirects() {
    return [
      {
        source: '/pricing',
        destination: '/features',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
