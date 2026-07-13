import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'packages/engine/src/**/*.test.ts',
      'packages/api-client/src/**/*.test.ts',
      // Mobile: only pure modules (no React Native imports) — this runner has
      // no RN transform, so anything importing `react-native` must not be here.
      'packages/mobile/src/lib/auth/jwt.test.ts',
    ],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pleiad/engine': path.resolve(__dirname, './packages/engine/src'),
      '@pleiad/api-client': path.resolve(__dirname, './packages/api-client/src'),
    },
  },
})
