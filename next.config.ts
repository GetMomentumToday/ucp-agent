import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@omnixhq/ucp-client', 'better-sqlite3'],
};

export default nextConfig;
