import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // @babel/parser and @babel/traverse reference process.env.NODE_ENV
  // internally. Vite replaces this automatically in regular app chunks but
  // NOT in Web Worker bundles built via `new Worker(new URL(...))`, which
  // otherwise throws `ReferenceError: process is not defined` at runtime
  // inside the worker. Defining it explicitly here fixes that for both dev
  // and production builds.
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'XAUDIT',
        short_name: 'XAUDIT',
        description: 'Client-side static code checker for JavaScript, TypeScript, React/JSX, and HTML patterns.',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo-square.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo-square.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
