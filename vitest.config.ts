import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Automated suite config. Run with `npm run test:unit` or `npm run test:ui`
// after packages are installed. Existing `npm test` (tsx scripts) is untouched.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    testTimeout: 25000,
    hookTimeout: 25000,
    fileParallelism: false,
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/ui/**/*.test.{ts,tsx}'],
  },
});
