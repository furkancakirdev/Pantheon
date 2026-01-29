import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts', 'redis.ts', 'stock-registry.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['@prisma/client', 'ioredis'],
});
