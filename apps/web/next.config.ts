import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Next.js 16 Turbopack config
  turbopack: {
    // Empty config to enable Turbopack properly
  },

  // Webpack config (fallback for --webpack flag)
  webpack: (config) => {
    config.resolve.modules.push(path.resolve(__dirname, '../../packages'));
    config.resolve.alias = {
      ...config.resolve.alias,
      '@api': path.resolve(__dirname, '../../packages/api-clients'),
      '@analysis': path.resolve(__dirname, '../../packages/analysis'),
      '@db': path.resolve(__dirname, '../../packages/db'),
      '@api-clients': path.resolve(__dirname, '../../packages/api-clients'),
      '@sentiment': path.resolve(__dirname, '../../packages/sentiment'),
    };
    return config;
  },
};

export default nextConfig;
