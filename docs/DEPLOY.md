# Deploy TypeShyt to Vercel

The repository includes `vercel.json` for SPA fallback and `public/404.html` as a static-host 404 fallback. No server-side environment variables are required.

## First deployment

1. Push the project to GitHub, including `package-lock.json`.
2. Sign in to [Vercel](https://vercel.com/) and choose **Add New → Project**.
3. Import `anuragnibhamishra/typeshyt` from GitHub and authorize repository access if asked.
4. Confirm the framework preset is **Vite** (or Other) and set:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js version: `22.x` (Project Settings → General → Node.js Version)
5. Choose **Deploy**. Wait for the deployment to finish and copy its URL into the TODO placeholders in `index.html` and `README.md`.

## Preview and custom domain

- Vercel creates preview deployments for branch pushes and pull requests, and a production deployment for the configured production branch (normally `main`). Confirm the production branch under Project Settings → Git.
- To add a domain, open Project Settings → Domains, enter the domain, then follow Vercel's DNS instructions at your DNS provider. Wait for Vercel to report that DNS and TLS are configured.
- After selecting the final canonical domain, update `link[rel=canonical]`, `og:url`, `og:image`, and `twitter:image` in `index.html`. Set the deployed demo link in `README.md`; redeploy afterward.

## Deploy check

Run this checklist against the production URL on desktop and on a real phone:

- [ ] The page loads without visible errors and the browser console is clean.
- [ ] Timed, word-count, code, and weak-key modes can be selected and completed. For weak keys, verify both the minimum-data fallback and targeted practice once there is enough real data.
- [ ] Complete a test, confirm the result appears in history, refresh, and confirm it remains.
- [ ] Refresh a non-root URL such as `/launch-check/`; Vercel should serve the SPA entry point.
- [ ] Check the favicon in the browser tab.
- [ ] Check the Open Graph preview after updating metadata using the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or LinkedIn Post Inspector. The source image is currently SVG; if a share platform rejects SVG, export `public/og.svg` as a 1200×630 PNG, save as `public/og.png`, and update both image tags.
- If Inkscape is installed, export with `inkscape public/og.svg --export-filename=public/og.png --export-width=1200 --export-height=630`.
- [ ] On a real phone, confirm the keyboard opens, text entry and Backspace work, scrolling keeps the caret visible, and controls do not overflow.

Optional: run Lighthouse locally against the deployed URL and record only the scores actually obtained. No Lighthouse result is currently claimed.
