# Deploying AuditX to Vercel

AuditX is a client-side React application (Vite). It is fully optimized for Vercel.

## Option 1: Vercel CLI (Recommended)

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
    - Project Name: **auditx**
    - In which directory is your code located? **./**
    - **Auto-Detect**: It should detect `Vite`.
    - **Override settings**: **N** (Default settings work perfectly).

4.  **Production Push**:
    Once you are happy with the preview deployment:
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

## Configuration Note (`vercel.json`)
We have included a `vercel.json` file in the root directory. This handles the Single Page Application (SPA) routing, ensuring that refreshing a page like `/audit` or `/history` doesn't return a 404 error but correctly loads the React app.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
