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
- [ ] Ajouter la sécurité : validation, limitation de débit, contrôle d’accès, CSP, révocation et journaux.
- [x] Ajouter les tests Vitest essentiels pour slugs, jetons, import, recherche, résolution et expiration.
- [x] Ajouter la configuration Vercel, les scripts de build et le README (les secrets restent gérés hors du dépôt).
- [x] Vérifier la qualité visuelle desktop/mobile et corriger les problèmes de responsive.
- [x] Vérifier typecheck, tests et build de production.
- [ ] Sauvegarder le checkpoint final et préparer le dépôt GitHub prêt à pousser (dépôt sélectionné public : amazonkadipi-collab/sm3ha).

- [x] إنشاء صفحة وفهرس فنان ديناميكيين مع إجراء tRPC للفنانين.
- [x] تنفيذ رابط تنزيل demo حقيقي مؤقت وموقّع مع endpoint وانتهاء صلاحية قابل للاختبار.
- [ ] إظهار حالة منع واضحة في /admin للمستخدم غير الإداري.
- [x] استكمال import JSON وcommit demo مع توليد slugs/tokens والتحقق من الصلاحيات.
- [x] إضافة metadata ديناميكية للصفحات؛ JSON-LD يبقى تحسيناً لاحقاً.
- [x] إضافة اختبارات import وحل token وانتهاء الرابط.
- [ ] توثيق توافق Vercel الفعلي أو تقييده بوضوح إلى frontend demo إذا بقي backend مرتبطاً ببيئة Node.
- [x] إجراء تحقق mobile viewport وتصحيح ملاحظات branding والهرمية البصرية.

- [x] إنشاء صفحة index عامة للفنانين على /artists مرتبطة بإجراء catalog.artists.
- [x] جعل commit demo يحفظ السجلات فعلياً في قاعدة البيانات ويولد opaque tokens لكل صف.
- [ ] توسيع metadata الديناميكية للصفحات العامة وإضافة JSON-LD مناسب.
- [x] إضافة اختبارات أساسية لمسار الاستيراد والتنزيل الموقّع؛ اختبارات tRPC المباشرة تبقى تحسيناً لاحقاً.
- [ ] تطبيق تعديلات ملموسة على wordmark والهرمية البصرية بعد المراجعة المرئية.
- [x] Ajouter un test Vitest de `admin.previewImport` et documenter le commit demo sans fixtures persistantes de test.
