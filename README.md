# نغمة — Arabic-first music discovery demo

Original branding and demo content. This repository intentionally does not scrape providers or ship copyrighted media.

## Run
1. `npm install`
2. Copy `.env.example` to `.env` and configure PostgreSQL plus a strong `TOKEN_SECRET`.
3. `npm run db:generate`
4. `npm run db:migrate`
5. `npm run dev`

Frontend: http://localhost:5173 · API: http://localhost:3001

## Production notes
- Replace the demo provider adapter with an official, permitted metadata provider.
- Implement S3-compatible storage with short-lived signed URLs for content you are authorized to distribute.
- Put admin authentication behind HttpOnly/SameSite cookies and CSRF protection.
- Add Prisma persistence to API handlers, background conversion workers, structured logging, monitoring, and full E2E coverage before production.
- Never place provider credentials in client code.
