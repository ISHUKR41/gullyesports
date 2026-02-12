/*
 * ============================================================================
 * GULLYESPORTS - Vite Configuration
 * ============================================================================
 * Purpose: Configure Vite for multi-page application (MPA) setup.
 *
 * How it works:
 *   - Vite normally only handles index.html
 *   - We configure "rollupOptions.input" to include ALL html pages
 *   - This allows each page (pubg.html, contact.html, etc.) to be its own entry
 *   - Dev server proxies /api requests to the backend on port 5000
 * ============================================================================
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Root directory where HTML files live
  root: './',

  // Dev server configuration
  server: {
    port: 5173,
    open: true,

    // Proxy API calls to the backend server during development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Build configuration for production
  build: {
    outDir: 'dist',
    rollupOptions: {
      // List all HTML pages so Vite bundles them all
      input: {
        main: resolve(__dirname, 'index.html'),
        pubg: resolve(__dirname, 'pubg.html'),
        freefire: resolve(__dirname, 'freefire.html'),
        cod: resolve(__dirname, 'cod.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        register: resolve(__dirname, 'register.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
