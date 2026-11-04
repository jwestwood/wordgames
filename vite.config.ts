/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@core': '/src/core' } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
