import type { NextConfig } from 'next';

const isGhPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGhPages ? '/amicale-de-la-contree' : '',
  transpilePackages: ['@contree/engine'],
};

export default nextConfig;
