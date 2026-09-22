import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.LEDGER_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'icons/ledger.svg', 'sample-analytics7.xml'],
      manifest: {
        name: 'Ledger · Poker sessions', short_name: 'Ledger',
        description: 'A private cash-game session log.',
        id: base, start_url: base, scope: base, display: 'standalone',
        background_color: '#f2f2f3', theme_color: '#f2f2f3',
        icons: [
          { src: base + 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: base + 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: base + 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,xml}'], navigateFallback: base + 'index.html' },
    }),
  ],
});
