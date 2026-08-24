# Vercel/GitHub audit — 2026-08-24

Repository: `https://github.com/amazonkadipi-collab/sm3ha`

The remote `main` branch currently resolves to `86a055e58e987631e1994c25bce6867d51d312b1`. It contains `index.ts`, `vercel.json`, `package.json`, and `client/index.html` with the Google Search Console verification tag. The current Vercel config has no custom `outputDirectory` and uses an SPA rewrite that excludes `/api/*` and `/manus-storage/*`. The build script copies `dist/public` into `public/` and builds the local server bundle.

GitHub reports a successful Vercel Production deployment for the current SHA (`86a055e...`) at 2026-08-24 14:07 UTC.

External checks against `https://sm3haa.vercel.app/` still show HTTP 200 for the homepage, but the response does not contain `google-site-verification`. `https://sm3haa.vercel.app/api/trpc/auth.me` still returns HTTP 404 with Vercel `NOT_FOUND`. This means the alias is still attached to a different Vercel project/deployment or has not adopted the GitHub-linked project, despite successful GitHub/Vercel deployment status.

The latest successful deployment linked to the preceding code used a separate generated target URL and was protected by Vercel SSO. The public alias has not been proven to point to the GitHub-linked deployment. Final resolution requires attaching `sm3haa.vercel.app` to the Vercel project connected to the GitHub repository, or using the generated target URL after making it public, then retesting the API and Google meta.

## Second audit pass

At 2026-08-24 14:16 UTC, GitHub `main` and the local checkout both resolved to `86a055e58e987631e1994c25bce6867d51d312b1`. The current source contains the root Express entrypoint, the Vercel config, the build command that copies Vite output into `public/`, and the Google verification meta tag.

GitHub shows a successful Production deployment `6064373212` for that SHA. Its generated target URL is `https://sm3ha-fxn11utjl-amazonkadipi-3114s-projects.vercel.app`, but requests to that target redirect to Vercel SSO, so it cannot be externally verified without access to that Vercel project.

The public alias `https://sm3haa.vercel.app` returns HTTP 200 for `/`, but its HTML has no Google verification meta. `/api/trpc/auth.me` and `/admin` both return HTTP 404 `NOT_FOUND`. Therefore the remaining fault is outside the committed source: the public alias is not attached to the GitHub-linked Vercel project/deployment, or it is attached to a separate project with a different source/configuration. Code changes alone cannot retarget a Vercel domain alias.

## Third audit pass

The repository and GitHub `main` are synchronized at `86a055e58e987631e1994c25bce6867d51d312b1`. GitHub confirms the source includes `index.ts`, the Vercel config, the public-output build command, and the Google verification meta. The latest GitHub-linked Vercel Production deployment is successful and targets `https://sm3ha-fxn11utjl-amazonkadipi-3114s-projects.vercel.app`.

The requested public alias `https://sm3haa.vercel.app` still returns HTTP 200 for the homepage but has no Google verification meta; `/api/trpc/auth.me` and `/admin` both return HTTP 404 `NOT_FOUND`. The alias therefore is not attached to the latest GitHub-linked Vercel project/deployment. Retargeting a Vercel domain alias requires access to the Vercel project dashboard or a valid Vercel connector/token; it cannot be done by changing GitHub source files alone.
