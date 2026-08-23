# NaghmaHub

NaghmaHub is an Arabic-first RTL music discovery experience with a calm pastel editorial interface, database-backed catalog, dynamic SEO-friendly song pages, protected opaque media tokens, an admin CSV preview flow, and a safe demonstration conversion experience.

## Product boundaries

The conversion flow is intentionally demonstrative. It does not scrape YouTube, bypass provider protection, or download unauthorized content. Production conversion must be connected only to an authorized/licensed provider. The current demo provider returns short-lived placeholder results and explains the limitation in the UI.

## Stack

The app uses React, TypeScript, Vite, TailwindCSS, Express/tRPC, Drizzle ORM, and the managed MySQL-compatible database provided by the project template. The public catalog is rendered through reusable dynamic routes such as `/s/:slug` and `/media?d=:token`.

## Local development

```bash
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
```

The database schema is defined in `drizzle/schema.ts`. Generate a migration with `pnpm drizzle-kit generate`, review the SQL, and apply it through the project database migration workflow. Demo records are inserted into the managed database during project setup.

## Environment

Copy `.env.example` to your local environment. Secrets are injected by the managed project environment and must never be committed. The demo mode does not require YouTube or converter credentials.

## Routes

- `/` — landing page and search.
- `/search?q=...` — catalog search.
- `/trending` — trending demo catalog.
- `/s/:slug` — dynamic song detail page.
- `/media?d=...` — server-resolved opaque media token page.
- `/videos_dl?v=...` — demonstration conversion status flow.
- `/admin` — authenticated catalog import preview.
- `/privacy`, `/terms`, `/dmca`, `/contact` — legal and contact pages.

## Vercel notes

The frontend build is Vite-based and the production build command is `pnpm build`. For Vercel, configure the project to use Node 22, install with `pnpm install --frozen-lockfile`, build with `pnpm build`, and provide the same environment variables as the managed project. The current project server is optimized for the managed single-process runtime; if deploying to Vercel Functions, adapt the Express entrypoint to a Vercel function adapter and keep the database connection lazy/server-side.

## GitHub

This repository is ready for a private GitHub push. Do not commit `.env`, provider credentials, generated secrets, or unauthorized media files.

## Testing strategy for admin import

`server/admin.import.test.ts` exercises the protected `admin.previewImport` procedure with an authenticated admin context, including slug generation and duplicate provider-ID detection. The `commitImport` procedure persists only demo rows when explicitly invoked by an authenticated administrator and is not called from Vitest fixtures, so automated tests never create persistent database records or contaminate a shared environment. Its database path returns an explicit `database_unavailable` result when no connection exists and is intended for manual integration validation against a disposable database.
