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
    // Configure Vite server to handle API requests properly
    proxy: {
      // This helps with CORS and ensures the MSW can intercept without issues
      '/api': {
        // Target doesn't matter since MSW intercepts
        target: 'http://localhost:5173',
        changeOrigin: true,
        secure: false,
        // Explicitly rewrite the path to ensure MSW can intercept it
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
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
