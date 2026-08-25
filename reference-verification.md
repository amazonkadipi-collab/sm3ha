
# Verification معمق لـ v1.sm3ha.io — 2026-08-25

## مؤكد من HTML والصفحات

homepage كتتغير فيها لائحة الكلمات الظاهرة عند كل فتح/تحديث، وفي الفحص الأخير ظهرت حوالي 48 keyword مختلفة. كل keyword هو anchor إلى `/s/{slug}`، مثلاً «راي» إلى `/s/%D8%B1%D8%A7%D9%8A`. هذا يؤكد وجود لائحة dynamic أو latest-searches/catalog pages، لكنه لا يكشف وحده واش التوليد يتم عبر API أو job داخلي أو جدول جاهز.

صفحة `/s/راي` كتحتوي على حوالي 10 rows في HTML المستخرج. كل row فيها صورة YouTube من `i.ytimg.com`، عنوان أو عنوان مختصر، مدة، رابط تحميل opaque من `/media?d=<hash>`، ورابط «مشاهدة» على fragment مثل `#YBETWFkzTtM`. أول نتيجة في الفحص الحالي كانت video ID `YBETWFkzTtM` ورابط media `c67f9c51d322bb49623151a96c734bcb`.

## الاستنتاج الدقيق

المؤكد هو أن الموقع عنده records أو rendered results جاهزة للـkeyword وقت الطلب، وأن homepage تعرض subset حديثاً منها. غير المؤكد هو مصدر الإدخال الداخلي، لأن backend/database والـjobs غير مكشوفة للزائر. أقوى تفسير تقني هو ingestion يحفظ query + slug + نتائج metadata ثم يعيد استعمال template واحد لكل `/s/:slug`. لا يمكن إثبات أن كل search جديد يضيف record أو أن YouTube API يستدعى في كل زيارة بدون access إلى server logs أو database.

## اختبار keyword ثانية وmedia

`/s/اغاني` عرضت أيضاً حوالي 10 records مختلفة، مع YouTube thumbnails ومدة وروابط opaque مستقلة، ما يؤكد أن النمط عام وليس خاصاً بـ«راي». فتح media المرجعي لرابط `c67f9c51d322bb49623151a96c734bcb` عرض title المصدر، كود الملف `YBETWFkzTtM`، المدة `03:06`، والكوالتي `Mp3@128kbps - Mp4@720p/360p`، ثم زر `DOWNLOAD NOW` إلى `/videos_dl?v=YBETWFkzTtM`. كما ظهرت وصلة «تحميل مباشر» إلى domain خارجي؛ تم رصدها فقط ولم يتم فتحها أو تشغيل تنزيل، لأنها ليست ضرورية للمقارنة الآمنة.
