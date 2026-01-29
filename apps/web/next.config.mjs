import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // Output mode for deployment
  output: 'standalone',

  // Transpile workspace packages (including @pantheon/db for proper module resolution)
  transpilePackages: ['@pantheon/analysis', '@pantheon/api-clients', '@pantheon/db', '@pantheon/sentiment', '@prisma/client'],

  // External packages for server components - don't bundle these
  // serverExternalPackages: ['@prisma/client'], // Removed to ensure proper bundling

  // Turbopack config (use Webpack for monorepo compatibility)
  turbopack: {},

  // Webpack config
  webpack: (config, { isServer }) => {
    // Don't bundle Prisma client for server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@prisma/client');
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
