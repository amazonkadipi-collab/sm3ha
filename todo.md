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
