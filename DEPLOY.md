# Deploying XAUDIT to Vercel

XAUDIT is a client-side React application (Vite) with no backend and no server-side code. It's a static build.

## Option 1: Vercel CLI

1.  **Install Vercel CLI**:
    ```bash
    npm i -g vercel
    ```

2.  **Login**:
    ```bash
    vercel login
    ```

3.  **Deploy**:
    Run this command in the project root:
    ```bash
    vercel
    ```
    - Set up and deploy? **Y**
    - Which scope? **(Select your account)**
    - Link to existing project? **N**
    - Project Name: **xaudit**
    - In which directory is your code located? **./**
    - **Auto-Detect**: It should detect `Vite`.
    - **Override settings**: **N** (Default settings work).

4.  **Production Push**:
    ```bash
    vercel --prod
    ```

## Option 2: Git Integration

1.  Push your code to a GitHub/GitLab/Bitbucket repository.
2.  Go to [Vercel Dashboard](https://vercel.com/new).
3.  Import the repository.
4.  **Framework Preset**: Select `Vite`.
5.  **Root Directory**: `./`.
6.  Click **Deploy**.

## Before deploying, run these locally

```bash
npm test            # must pass — this is the regression gate
npm run build
npm run preview     # serves the production build with the same CSP/security
                     # headers as vercel.json below; check the browser console
                     # for CSP violations before trusting the deploy
```

## `vercel.json`

Two things are configured here, both required, not optional:

1. **SPA routing** — a rewrite so refreshing `/audit` or `/audit/history` doesn't 404.
2. **Security headers** — a strict `Content-Security-Policy` (no `unsafe-inline`, no `unsafe-eval`, `frame-ancestors 'none'`), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`. These were verified locally against the production build via `npm run preview` (see `vite.config.js`'s matching `preview.headers` block) before being written here — **the live Vercel deployment's headers have not been independently re-verified after deploy**, so check them with `curl -I <your-deployed-url>` once live and compare against `vercel.json`.

**These headers are Vercel-specific, and that's a real gap, not a footnote.** `vercel.json`'s `headers` block is only honored by Vercel's own routing layer — nothing in `index.html` (no CSP `<meta>` tag) or the built `dist/` output itself carries this protection. If you deploy the same build to Netlify, Cloudflare Pages, GitHub Pages, S3, or a plain nginx/Docker static host instead, you get **none** of it unless you configure the equivalent yourself:
- **Netlify**: add a `public/_headers` file with the same header set.
- **Cloudflare Pages**: same idea, a `_headers` file in the publish directory.
- **GitHub Pages / S3 / plain static hosting**: no first-party header mechanism — you'd need a reverse proxy (nginx, CloudFront + Lambda@Edge, etc.) in front of the static files.

Found and disclosed during a self-audit (`docs/self-audit-2026-09-03.md`, finding F-03) — not fixed by adding a universal mechanism (there isn't one that works identically across every static host), fixed by disclosing it clearly instead.

```json
{
    "rewrites": [
        { "source": "/(.*)", "destination": "/index.html" }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
                { "key": "X-Content-Type-Options", "value": "nosniff" },
                { "key": "X-Frame-Options", "value": "DENY" },
                { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
                { "key": "Permissions-Policy", "value": "geolocation=(), camera=(), microphone=(), payment=()" },
                { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
            ]
        }
    ]
}
```
