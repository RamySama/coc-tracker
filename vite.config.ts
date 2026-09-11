/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      devOptions: { enabled: false },
      manifest: {
        name: 'CoC Upgrade Tracker',
        short_name: 'CoC Tracker',
        description: 'Suivi des améliorations de bâtiments pour Clash of Clans',
        lang: 'fr',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        // v1 : icône SVG unique. TODO remplacer par de vrais PNG 192/512 + maskable.
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        // dataset JSON précaché ; les icônes /coc/ passent en cache runtime
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/coc/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'coc-icons',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
  ],
  // en dev via `tauri dev`, ignorer src-tauri : Cargo y écrit pendant la
  // compilation et le watcher de Vite plante sinon (EBUSY sous Windows).
  server: {
    watch: { ignored: ['**/src-tauri/**'] },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
