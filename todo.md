# Project TODO

- [x] Définir la direction visuelle RTL apaisante avec dégradés lavande, rose poudré et menthe pâle.
- [x] Construire le shell public responsive avec navigation arabe RTL, recherche et mode sombre.
- [x] Ajouter les pages accueil, résultats, tendances, artiste et morceau dynamiques (route artiste ajoutée).
- [x] Ajouter le schéma de données du catalogue, des artistes, albums, variantes média, tâches de conversion et retraits.
- [x] Ajouter les procédures serveur publiques pour recherche, tendances, artistes, morceaux et résolution de jetons (artistes ajouté).
- [x] Ajouter les métadonnées de démonstration autorisées et un fournisseur mock sécurisé.
- [x] Implémenter la génération de slugs SEO stables et de jetons opaques sécurisés.
- [x] Implémenter le flux média démonstratif avec statuts de traitement et liens temporaires autorisés uniquement (endpoint HMAC ajouté).
- [x] Ajouter la console d’administration protégée et réutiliser DashboardLayout.
- [x] Ajouter l’import CSV/JSON avec aperçu, validation, doublons et génération automatique des slugs/jetons.
- [x] Ajouter les pages conditions, contact, retrait/DMCA et contact.
- [x] Ajouter sitemap.xml, robots.txt, métadonnées dynamiques et données structurées SEO.
- [x] Ajouter les états loading, vide, erreur, succès et reprise du flux démonstratif.
- [x] Ajouter une baseline sécurité : validation Zod, limitation de débit, contrôle d’accès, CSP, révocation HMAC et réponses d’erreur; les journaux avancés restent hors périmètre demo.
- [x] Ajouter les tests Vitest essentiels pour slugs, jetons, import, recherche, résolution et expiration.
- [x] Ajouter la configuration Vercel, les scripts de build et le README (les secrets restent gérés hors du dépôt).
- [x] Vérifier la qualité visuelle desktop/mobile et corriger les problèmes de responsive.
- [x] Vérifier typecheck, tests et build de production.
- [x] Sauvegarder le checkpoint final et préparer le dépôt GitHub prêt à pousser (dépôt sélectionné public : amazonkadipi-collab/sm3ha).

- [x] إنشاء صفحة وفهرس فنان ديناميكيين مع إجراء tRPC للفنانين.
- [x] تنفيذ رابط تنزيل demo حقيقي مؤقت وموقّع مع endpoint وانتهاء صلاحية قابل للاختبار.
- [x] إظهار حالة منع واضحة في /admin للمستخدم غير الإداري.
- [x] استكمال import JSON وcommit demo مع توليد slugs/tokens والتحقق من الصلاحيات.
- [x] إضافة metadata ديناميكية للصفحات؛ JSON-LD يبقى تحسيناً لاحقاً.
- [x] إضافة اختبارات import وحل token وانتهاء الرابط.
- [x] توثيق توافق Vercel: build/configuration جاهزان، مع توضيح أن backend يحتاج Vercel Function adapter عند النشر خارج runtime الحالي.
- [x] إجراء تحقق mobile viewport وتصحيح ملاحظات branding والهرمية البصرية.

- [x] إنشاء صفحة index عامة للفنانين على /artists مرتبطة بإجراء catalog.artists.
- [x] جعل commit demo يحفظ السجلات فعلياً في قاعدة البيانات ويولد opaque tokens لكل صف.
- [x] توسيع metadata الديناميكية لصفحات song/artist وإضافة JSON-LD MusicRecording/MusicGroup؛ الصفحات الثابتة تعتمد metadata العامة.
- [x] إضافة اختبارات أساسية لمسار الاستيراد والتنزيل الموقّع؛ اختبارات tRPC المباشرة تبقى تحسيناً لاحقاً.
- [x] تطبيق تعديلات ملموسة على wordmark والهرمية البصرية: نغمة/NaghmaHub موحد، رمز sparkle صوتي، وألوان aubergine أوضح.
- [x] Ajouter un test Vitest de `admin.previewImport` et documenter le commit demo sans fixtures persistantes de test.
- [x] التحقق فعلياً من حالة git والـremote وتجهيز push إلى المستودع المحدد.
- [x] تطبيق تعديل بصري واضح بعد المراجعة على wordmark والهرمية ثم إعادة screenshot desktop/mobile.

- [x] مواءمة البنية العامة وتجربة الاستخدام مع v1.sm3ha.io دون نسخ الهوية أو الكود أو الأصول المحمية.
- [x] مراجعة routes البحث والنتائج وmedia والتحويل لتكون أقرب إلى structure المرجعي مع بقاء التدفق demo وآمناً.
- [x] إعادة فحص الواجهة desktop/mobile والاختبارات بعد التعديلات.

- [x] مواءمة التصميم البصري مع v1.sm3ha.io: الخلفية، الهيدر، search hero، البطاقات، والمسافات مع الحفاظ على branding أصلي.
- [x] إعادة فحص صفحات homepage/search/song/media على desktop وmobile بعد تعديل التصميم.

- [x] اختيار مشروع Supabase وتوثيق project ID وconnection method: `dfocwmbnazuygbazdctn`، EU West 2، URL موثق في إعدادات البيئة.
- [x] إنشاء وتطبيق migration/schema Supabase صريح للكتالوج والفنانين والألبومات والـmedia/import/takedown؛ الجداول العشرة موثقة ومفعّل عليها RLS.
- [x] إضافة اتصال server-side آمن مع Supabase وإبقاء fallback demo.
- [x] إدخال بيانات catalog demo المصرح والتحقق من search/resolve على صفوف Supabase فعلية؛ admin import يبقى مسار إدخال الإنتاج.
- [x] تحديث README وSupabase migration واختبار اتصال Supabase؛ secrets لا تدخل إلى GitHub ولا توجد fixtures دائمة.

- [x] تعريب النصوص الظاهرة في الواجهة العامة والبحث والاتجاهات وصفحات الفنان والمقطع والميديا.
- [x] تعريب لوحة الإدارة والصفحات القانونية ورسائل النجاح والخطأ وحالات التحميل.
- [x] فحص النصوص الأجنبية الظاهرة وإعادة اختبار الواجهة العربية على سطح المكتب والهاتف.

- [x] استبدال محتوى `main` في GitHub بنسخة NaghmaHub النهائية بعد التأكيد، مع الاحتفاظ بالفروع القديمة.
- [x] التحقق من أن `main` يعرض الكود الكامل والواجهة العربية بعد الدفع.

- [x] تشخيص خطأ نشر Vercel: المرفق كان bundle مبنيّاً وليس سجل خطأ صريحاً؛ تم تحديد تعارض static rewrite مع Express server.
- [x] إصلاح إعدادات وentrypoints Vercel مع الحفاظ على تشغيل Manus الحالي، مع استثناء `/api/*` من SPA rewrite وإضافة catch-all Function.
- [x] إعادة تشغيل الاختبارات وbuild والتحقق من entrypoint serverless ومسار `/api/demo-download/:token` محلياً قبل الدفع.

- [x] تحليل مشكلة Vercel الحالية من المستودع والسجلات وإعدادات functions/rewrites.
- [x] إعادة اختبار الواجهة ومسارات `/api/trpc` و`/api/oauth/callback` و`/api/demo-download` وتحديد سبب المشكلة.
- [x] تطبيق إصلاح root Express entrypoint واستثناء storage proxy من SPA fallback وتوثيق النتيجة وتشغيل الاختبارات والبناء.

- [x] تحليل workflow الظاهر في https://v1.sm3ha.io/، من البحث حتى صفحة الأغنية ومسار التحويل/التنزيل، مع فصل الملاحظات المؤكدة عن الاستنتاجات.

- [x] مواءمة رحلة NaghmaHub مع workflow المرجعي: `/search` إلى `/s/{slug}` ثم `/media` ثم صفحة تحويل demo.
- [x] إضافة تكامل YouTube Data API server-side للبحث وجلب metadata فقط، مع منع كشف المفتاح للواجهة.
- [x] إضافة Dashboard Admin عملي لإدارة البحث/الكتالوج والاستيراد والحالة والصلاحيات.
- [x] إضافة اختبارات التكامل، طلب secret، والتحقق البصري والوظيفي بعد التنفيذ.

- [x] تنفيذ انتقال فعلي من `/search` إلى صفحة `/s/{slug}` المناسبة، وإنشاء صفحة تحويل demo مستقلة لمسار `/videos_dl`.
- [x] إضافة إجراءات وواجهة Admin لعرض الكتالوج الحالي وإدارة حالة السجلات، مع توضيح حدود إدارة الأدوار.
- [x] إضافة اختبارات Vitest لتكامل `youtube.search` و`admin.commitImport` مع metadata الخاصة بـYouTube، وتوثيق تحقق التدفق الكامل.

- [x] تنفيذ انتقال موثق من البحث إلى صفحة الأغنية عند وجود نتيجة واحدة، مع إبقاء قائمة النتائج عند تعدد النتائج.
- [x] توسيع إدارة الكتالوج لتعرض الحالة الحقيقية وتشمل السجلات المخفية مع الاستعادة.
- [x] إضافة اختبار آمن لـadmin.commitImport مع metadata الخاصة بـYouTube وتوثيق تحقق التدفق الكامل دون بيانات دائمة تجريبية.

- [x] عزل persistImportedRows في اختبار والتحقق من تمرير provider وthumbnailUrl وdurationSeconds من commitImport إلى طبقة التخزين.
- [x] توثيق تحقق التدفق الكامل YouTube search → commit → catalog، مع التنبيه أنه اختبار معزول بلا بيانات دائمة.

- [x] إضافة login مستقل للـAdmin باسم `admin` مع كلمة مرور server-side secret وعدم تخزينها في الكود.
- [x] ربط جلسة login الجديدة بصلاحية admin وحماية `/admin` وprocedures الإدارية.
- [x] إضافة اختبارات login/logout والفشل وكلمة المرور والتحقق ثم توثيق تحذير production.

- [x] إزالة قيمة كلمة المرور الصريحة من README وfallback الاختبار، والاكتفاء بأسماء متغيرات البيئة.
- [x] إضافة اختبار login ثم logout للتحقق من إنهاء جلسة admin ومسح cookie فعلياً.

- [x] مقارنة workflow الحالي مع v1.sm3ha.io وتحسين التسلسل المرئي: البحث، النتائج، التفاصيل، media، والتحويل demo.
- [x] جعل زر التحويل في `/media` ينتقل فعلياً إلى `/videos_dl?v=...` مثل الرحلة المرجعية، مع إبقاء الصفحة demo الآمنة.

- [x] توثيق route hierarchy والكلمات العامة القابلة لإعادة الصياغة من الموقع المرجعي بدون نسخ الهوية أو المحتوى المحمي.
- [x] مواءمة routes وworkflow في NaghmaHub مع `/search` و`/s/{slug}` و`/media` و`/videos_dl` وظيفياً.
- [x] تحسين title وdescription وcanonical وOpen Graph وJSON-LD وsitemap للكلمات العربية المستهدفة بدون keyword stuffing.
- [x] تشغيل اختبارات SEO/routes والبناء وحفظ checkpoint للمطابقة.

- [x] إضافة اختبار SEO metadata للصفحات الرئيسية والبحث والأغنية والتحويل، بما يشمل title وdescription وcanonical وrobots.
- [x] إضافة اختبار route-level موثق يثبت تسلسل `/search` → `/s/:slug` → `/media` → `/videos_dl` بعد تغييرات SEO.

- [x] إضافة اختبار runtime فعلي لـapplySeo في DOM يتحقق من title وdescription وrobots وcanonical وOG لكل نوع صفحة.
- [x] إضافة اختبار route-flow فعلي ببيئة متصفح/DOM يثبت تنقل البحث والروابط بين الأغنية وmedia وvideos_dl.

- [x] إضافة اختبار DOM فعلي لـSearchPage بنتيجة واحدة mocked والتحقق من redirect أثناء التشغيل.
- [x] إضافة اختبار DOM فعلي لـSongPage وMediaPage ببيانات mocked والتحقق من روابط media وvideos_dl داخل الواجهة.

- [x] مواءمة header مع المرجع: الشعار، روابط الرئيسية/جديد البحث، وأيقونة القائمة والمظهر.
- [x] مواءمة footer مع المرجع: الروابط، الترتيب، والمسافات على desktop وmobile.
- [x] اختبار menu والـshell بصرياً ووظيفياً على desktop وmobile ثم حفظ checkpoint.

- [x] اختبار فتح وإغلاق mobile menu وتأكد إغلاقها عند النقر على رابط.
- [x] التقاط walkthrough كامل يثبت header/footer وحالة menu المفتوحة على desktop/mobile.
- [x] التقاط لقطات full-page للـheader والـfooter على desktop وmobile، مع توثيق حالة menu المفتوحة باختبار DOM قبل checkpoint.

- [x] تبسيط روابط Header والـmobile menu إلى «الرئيسية» و«جديد البحث» فقط، مع إبقاء باقي الصفحات في Footer.
- [x] تشخيص وإصلاح عدم دخول المستخدم إلى لوحة Admin والتحقق من login/session والصلاحيات.
- [x] تشخيص رفض بيانات دخول Admin والتحقق من Secrets في بيئة التشغيل والنشر.
- [x] إصلاح 404 لمسارات `/api/trpc` وlogin في Vercel عبر إضافة serverless catch-all entrypoint؛ تم التحقق محلياً وخارجياً.
- [x] إعادة نشر Vercel بعد إضافة `api/[...path].ts` والتحقق من زوال 404 في `/api/trpc/auth.me` و`/api/trpc/auth.adminLogin`.
- [x] إجراء فحص وظيفي بعد النشر على `/admin` والتأكد من نجاح دخول admin ومرور session.
- [x] إضافة Google Search Console verification meta إلى الصفحة الرئيسية والتحقق منه ثم دفعه إلى GitHub لتشغيل Vercel تلقائياً.
- [x] دفع commit إضافة Google verification إلى GitHub `main` ثم التحقق من SHA البعيد: `de1377f284884a74db37d853b2fe7cb2b07662af`.
- [x] التحقق بعد النشر من ظهور Google verification meta في HTML الفعلي على Vercel؛ ظهر الوسم فعلياً على alias `sm3haa.vercel.app`.
- [x] ربط alias `sm3haa.vercel.app` بمشروع Vercel المتصل بمستودع `amazonkadipi-collab/sm3ha` ثم إعادة التحقق.
- [x] إعادة تدقيق GitHub وVercel وتحديد سبب خلل النشر أو اختلاف النسخة ثم تطبيق الإصلاح الممكن.
- [x] تنفيذ audit جديد لـGitHub وVercel، إصلاح الخلل الممكن، والتحقق من النشر والـalias وAPI.
- [x] فصل server app الخاص بـVercel عن Vite/Rollup runtime لتفادي `@rollup/rollup-linux-x64-gnu` وFUNCTION_INVOCATION_FAILED.
- [x] إصلاح نشر static public على Vercel بعد نجاح API؛ `/admin` وAPI وroot `/` صارت تعمل.
- [x] إضافة rewrite صريح من `/` إلى Vercel Function والتحقق من homepage وGoogle meta.
- [x] تحليل الملف المرفق ومقارنة bundle المنشور بالمستودع الحالي لتحديد سبب اختلاف نسخة Vercel؛ تبيّن أنه backend bundle وليس HTML الواجهة، مع اختلاف إعدادات Vercel/output عن الإصدار الحالي.

- [x] توليد `NAGHMAHUB_JWT_SECRET` آمن، إضافته كـSecret، وربطه بـ`ENV.cookieSecret` مع اختبار أولوية المفتاح.

- [x] تشغيل deployment جديد على Vercel بعد تحديث `NAGHMAHUB_JWT_SECRET` وبيانات Admin، ثم إعادة اختبار login الحي.

- [x] تنفيذ full audit جديد لـGitHub وVercel والـdeployment الحي، مع توثيق الحالة والإصلاحات والمخاطر المتبقية.

- [x] إصلاح رفض session في Production عندما يكون `VITE_APP_ID` فارغاً: ضمان appId داخلي غير فارغ لجلسات Admin وإضافة اختبار HTTP end-to-end لـadminLogin ثم auth.me.

- [x] إعادة audit بعد آخر push: GitHub، Vercel، deployment، routes، Admin session، وSEO.

- [x] تشخيص وإصلاح الصفحة البيضاء على `https://sm3haa.vercel.app/` والتحقق من JavaScript والـruntime والصفحة الرئيسية بعد النشر.

- [x] حذف جميع فروع GitHub غير `main` من `amazonkadipi-collab/sm3ha` والتحقق من بقاء `main` فقط.

- [x] إعادة فحص `https://sm3haa.vercel.app/` بعد تنظيف الفروع والتأكد من عدم رجوع الصفحة البيضاء.

- [x] تشخيص استمرار الصفحة البيضاء عند المستخدم بعد آخر deployment، ومقارنة alias وassets وruntime قبل إصلاح جديد.

- [x] تنفيذ full check نهائي لـGitHub وVercel وProduction routes وAdmin وSEO وruntime بعد آخر push.

- [x] إضافة Analytics حقيقية في Admin مبنية على أحداث الموقع، مع مؤشرات زمنية ومسارات الأكثر استعمالاً.
- [x] إضافة Search logs حقيقية محفوظة في قاعدة البيانات مع بحث وفلترة وترقيم.
- [x] إضافة إدارة DMCA/Takedown حقيقية مع إنشاء الطلبات وتحديث الحالات وسجل التدقيق.
- [x] إضافة Settings حقيقية للموقع والإعلانات والإعدادات التشغيلية مع صلاحيات Admin واختبارات.

- [x] توسيع workflow باستعمال YouTube Data API: بحث، حفظ metadata، deduplication، slug pages، وربط `/search` → `/s/{slug}` → `/media` بدون تنزيل محتوى محمي.
