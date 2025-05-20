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
    // Proxy all API requests to our mock server
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err) => {
            console.warn('Proxy error:', err);
          });
        }
      }
    }
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
