import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const buildHash = process.env.GITHUB_SHA?.slice(0, 7) || Date.now().toString(36);

export default defineConfig({
  base: '/game-cage-logic/',
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash),
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Cage Logic',
        short_name: 'Cage Logic',
        description: 'A KenKen-style logic puzzle: fill the grid so every cage computes correctly.',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'any',
        start_url: '/game-cage-logic/',
        scope: '/game-cage-logic/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        globIgnores: ['**/puzzles/**'],
        navigateFallback: '/game-cage-logic/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.includes('/puzzles/') && url.pathname.endsWith('.json'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'puzzle-banks',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
});
