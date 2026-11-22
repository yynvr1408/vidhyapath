import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Backend-focused unit tests for the web application.
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    testTimeout: 25000,
    hookTimeout: 25000,
    fileParallelism: false,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
});
