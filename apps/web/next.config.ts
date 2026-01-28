import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Output mode for deployment
  output: 'standalone',

  // Transpile workspace packages (NOT including @pantheon/db which contains Prisma)
  transpilePackages: ['@pantheon/analysis', '@pantheon/api-clients', '@pantheon/sentiment', '@pantheon/intelligence', '@pantheon/notifications'],

  // External packages for server components - don't bundle these
  serverExternalPackages: ['@prisma/client', '@pantheon/db'],

  // Turbopack config
  turbopack: {
    resolveAlias: {
      '@api': path.resolve(__dirname, '../../packages/api-clients'),
      '@analysis': path.resolve(__dirname, '../../packages/analysis'),
      '@db': path.resolve(__dirname, '../../packages/db'),
      '@api-clients': path.resolve(__dirname, '../../packages/api-clients'),
      '@sentiment': path.resolve(__dirname, '../../packages/sentiment'),
    },
  },

  // Webpack config
  webpack: (config, { isServer }) => {
    // Don't bundle Prisma client for server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@prisma/client');
      config.externals.push('@pantheon/db');
    }

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
