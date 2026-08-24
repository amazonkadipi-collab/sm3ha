# NaghmaHub

NaghmaHub is an Arabic-first RTL music discovery experience with a calm pastel editorial interface, database-backed catalog, dynamic SEO-friendly song pages, protected opaque media tokens, an admin CSV preview flow, and a safe demonstration conversion experience.

## Product boundaries

The conversion flow is intentionally demonstrative. It does not scrape YouTube, bypass provider protection, or download unauthorized content. Production conversion must be connected only to an authorized/licensed provider. The current demo provider returns short-lived placeholder results and explains the limitation in the UI.

## Stack

The app uses React, TypeScript, Vite, TailwindCSS, Express/tRPC, Drizzle ORM, and Supabase Postgres for the catalog when configured. The public catalog is rendered through reusable dynamic routes such as `/s/:slug` and `/media?d=:token`, with a local Drizzle/demo fallback for development.

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

Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the managed environment when using Supabase. Add `YOUTUBE_API_KEY` in the same server-side environment to enable protected Admin YouTube search. The key is read only by `server/youtube.ts`; never prefix it with `VITE_`, place it in client code, or commit it. YouTube is used for search and metadata only; the demo conversion flow never downloads external media.

## Routes

- `/` — landing page and search.
- `/search?q=...` — catalog search.
- `/trending` — trending demo catalog.
- `/s/:slug` — dynamic song detail page.
- `/media?d=...` — server-resolved opaque media token page.
- `/videos_dl?v=...` — demonstration conversion status flow.
- `/admin` — authenticated catalog dashboard with CSV/JSON preview, YouTube metadata search, and demo catalog import.
- `/privacy`, `/terms`, `/dmca`, `/contact` — legal and contact pages.

## Vercel notes

The frontend build is Vite-based and the production build command is `pnpm build`. The public journey is `/search?q=...` → `/s/:slug` → `/media?d=...` → `/videos_dl?v=...`; imported YouTube records keep `metadata_only` rights until separately licensed. For Vercel, configure Node 22, install with `pnpm install --frozen-lockfile`, build with `pnpm build`, and provide the same environment variables as the managed project. The `api/[...path].ts` file exports the Express application as a Vercel serverless catch-all, while `server/_core/index.ts` only starts a local listener outside Vercel. The `vercel.json` SPA fallback excludes `/api/*` and `/manus-storage/*`, while Vercel serves the generated `dist/public` assets as static output.

## GitHub

This repository is ready for a private GitHub push. Do not commit `.env`, provider credentials, generated secrets, or unauthorized media files.

## Testing strategy for admin import

`server/admin.import.test.ts` exercises the protected `admin.previewImport` procedure with an authenticated admin context, including slug generation and duplicate provider-ID detection. The `commitImport` procedure persists only demo rows when explicitly invoked by an authenticated administrator and is not called from Vitest fixtures, so automated tests never create persistent database records or contaminate a shared environment. Its database path returns an explicit `database_unavailable` result when no connection exists and is intended for manual integration validation against a disposable database.


## Supabase integration

The catalog can use the Supabase project configured for this deployment. The server reads `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` from the managed environment; the service-role key must never be exposed to the browser or committed to GitHub. When these variables are absent, the application falls back to the local Drizzle/demo catalog.

The active Supabase project is `dfocwmbnazuygbazdctn` in `eu-west-2`. The SQL migration in `supabase/0002_import_takedown.sql` adds import batches, import rows, takedown requests, indexes, and public read policies for active catalog records. Catalog reads use Supabase when configured, while admin imports upsert artists and songs and record batch/row outcomes in Supabase. Media remains demonstration-only and produces short-lived signed URLs only for authorized demo files.

For Vercel, configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `YOUTUBE_API_KEY` as server-side project environment variables. `YOUTUBE_API_KEY` is consumed only by the protected `/api/trpc/youtube.search` procedure through `server/youtube.ts`; it is never exposed as a `VITE_*` variable. Do not use the service-role key in any `VITE_*` variable. Run `pnpm test`, `pnpm check`, and `pnpm build` before deployment.

## نشر Vercel

يبني المشروع الواجهة إلى `dist/public`، ويُصدّر تطبيق Express من `api/[...path].ts` كـVercel Function catch-all وفق نمط Functions الرسمي. عند تشغيل المشروع محلياً يبدأ `server/_core/index.ts` listener، أما داخل Vercel فلا يبدأ listener محلياً. يستثني `vercel.json` مسارات API وstorage proxy من SPA fallback، بينما تُخدم ملفات الواجهة وملفات SEO الثابتة من مخرجات Vite. يجب إضافة `SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` ومتغيرات المصادقة المطلوبة في إعدادات Vercel، وعدم وضع أي قيمة سرية داخل Git.

التحويل في هذا الإصدار تجريبي وآمن فقط. لا يحتوي المشروع على تجاوز لحماية YouTube ولا يتيح تنزيل محتوى غير مصرّح به.

## YouTube admin workflow verification

من لوحة `/admin` يرسل المشرف عبارة البحث إلى الإجراء المحمي `youtube.search`. السيرفر ينادي `search.list` ثم `videos.list` للحصول على العنوان والقناة والصورة والمدة فقط؛ الضغط على «إضافة تجريبية» يرسل هذه metadata إلى `admin.commitImport`، الذي يحفظها في Supabase إن كانت البيئة متصلة، أو في Drizzle عند توفره، مع `rightsStatus=metadata_only` لسجلات YouTube. بعد نجاح الحفظ يعاد تحميل `admin.listCatalog` فتظهر النتيجة في جدول الكتالوج ويمكن إخفاؤها أو استعادتها.

التحقق الآلي يغطي طلب YouTube حقيقياً بمفتاح البيئة، ويموك البحث داخل tRPC، ويعزل طبقة Supabase ليثبت مرور `provider` و`thumbnailUrl` و`durationSeconds` دون إنشاء بيانات دائمة. التحقق الإنتاجي النهائي يتطلب تسجيل الدخول كمشرف، البحث، إضافة نتيجة واحدة، ثم التأكد من ظهورها في جدول الكتالوج وصفحتها العامة.

## Admin credential login

يمكن فتح `/admin` باستعمال login المستقل عبر `ADMIN_USERNAME` و`ADMIN_PASSWORD`. القيم تُحقن كـenvironment secrets ولا توجد داخل GitHub. الجلسة تُوقّع بـJWT cookie قصيرة الصلاحية، وتُعامل هوية `local_admin` كـadmin بدون طلب OAuth. يجب استعمال قيمة قوية لـ`ADMIN_PASSWORD` قبل أي نشر عام.

## SEO وعبارات البحث

تمت مواءمة الرحلة مع بنية المرجع باستعمال عبارات عربية طبيعية مرتبطة بنية المستخدم: «تحميل واستماع أغاني عربية»، «بحث عن أغنية أو ألبوم أو فنان»، «موسيقى عربية»، و«اختيار الصيغة والجودة». تُستخدم هذه العبارات في العناوين والوصف والروابط الداخلية حسب سياق الصفحة فقط، وليس في نص مخفي أو تكرار مصطنع. صفحات الأغاني تستعمل عنواناً ووصفاً وcanonical وOpen Graph و`MusicRecording` JSON-LD ديناميكياً، بينما صفحات media والتحويل التجريبي تحمل `noindex` ولا تدخل sitemap.
