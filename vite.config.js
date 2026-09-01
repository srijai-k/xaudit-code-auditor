import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Same policy as vercel.json's "headers" block for the production
// deployment — kept here too so `npm run build && npm run preview` lets
// you verify the built app actually works under this CSP locally, without
// needing a live Vercel deployment. NOT applied to `npm run dev` (Vite's
// dev server needs inline/eval machinery for HMR that this intentionally
// does not allow) — CSP is a production-only concern here.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// https://vite.dev/config/
export default defineConfig({
  preview: {
    headers: {
      'Content-Security-Policy': CONTENT_SECURITY_POLICY,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()',
    },
  },
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
