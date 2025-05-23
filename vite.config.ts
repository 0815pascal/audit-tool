/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['msw'],
  },
  plugins: [
    react()
  ],
  base: process.env.NODE_ENV === 'production' ? '/audit-tool/' : '/',
  server: {
    // No proxy needed - MSW handles API mocking
    // In production, configure your reverse proxy (nginx, etc.) to handle /api routes
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
