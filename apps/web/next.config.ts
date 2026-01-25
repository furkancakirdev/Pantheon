import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Force webpack instead of turbopack for monorepo support
  webpack: (config) => {
    // Add packages folder to module resolution
    config.resolve.modules.push(path.resolve(__dirname, '../../packages'));

    // Monorepo package aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@api': path.resolve(__dirname, '../../packages/api-clients'),
      '@analysis': path.resolve(__dirname, '../../packages/analysis'),
      '@db': path.resolve(__dirname, '../../packages/db'),
      '@api-clients': path.resolve(__dirname, '../../packages/api-clients'),
    };
    return config;
  },
};

export default nextConfig;
