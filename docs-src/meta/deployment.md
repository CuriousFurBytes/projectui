---
title: Deployment
---

# Deployment

The build output is a static site — no server required. Works offline after first load.

## Netlify

`netlify.toml` is included. Connect the repo — Netlify runs `npm run build` and serves `dist/`.

## Anywhere Else

```bash
npm run build
# Upload dist/ to Cloudflare Pages, Vercel, S3 + CloudFront, etc.
```
