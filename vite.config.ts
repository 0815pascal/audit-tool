import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        // Replace absolute paths with relative paths for GitHub Pages
        return html.replace(
          /<script type="module" src="\/src\/main.tsx"><\/script>/,
          '<script type="module" src="./assets/index.js"></script>'
        );
      }
    }
  ],
  base: '/audit-tool/',
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
