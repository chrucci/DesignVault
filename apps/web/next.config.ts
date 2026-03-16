import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@design-vault/shared'],
  serverExternalPackages: ['puppeteer'],
};

export default nextConfig;
