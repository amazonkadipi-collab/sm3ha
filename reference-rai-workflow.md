# فحص workflow المرجعي لكلمة راي

## Homepage
- الصفحة الرئيسية تعرض logo، روابط «الرئيسية» و«جديد البحث»، نموذج البحث، ثم قائمة كثيفة من الكلمات/الروابط إلى `/s/{slug}`.
- نموذج البحث عند إدخال «راي» يوجه مباشرة إلى `https://v1.sm3ha.io/s/%D8%B1%D8%A7%D9%8A`.

## صفحة keyword
- العنوان الظاهر: `تحميل راي Mp3 - سمعها`، والعنوان داخل الصفحة: `تحميل راي Mp3 Mp4 سمعها`.
- الصفحة تعرض عدة نتائج من metadata/صور YouTube. أول نتيجة: «خطفتلي»، المدة 4:22، صورة YouTube `3MglDmn0FOg`.
- رابط التحميل الأول: `/media?d=a6599a47b5809948db7a26e6c19c4cc3`.
- رابط المشاهدة الأول ظاهر كـfragment: `#3MglDmn0FOg`، وليس رابط YouTube مباشر في HTML الظاهر.
- باقي النتائج تستعمل نفس النمط: `/media?d=<opaque-token>` و`#<youtube-video-id>`.

## متابعة أول نتيجة
- أول «تحميل» من `/s/راي` فتح `https://v1.sm3ha.io/media?d=a6599a47b5809948db7a26e6c19c4cc3`.
- صفحة media عرضت كود الملف `3MglDmn0FOg`، مدة `04:21`، وquality `Mp3@128kbps - Mp4@720p/360p`.
- زر `DOWNLOAD NOW` فتح `https://v1.sm3ha.io/videos_dl?v=3MglDmn0FOg`.
- صفحة videos_dl أزالت زر DOWNLOAD NOW من body وبقي فيها رابط «تحميل مباشر» خارجي؛ NaghmaHub سيحافظ على الرابط الداخلي `/videos_dl?v=` لكنه لن يضيف redirect أو تنزيل خارجي غير موثوق.

## إعادة الفحص والنقر على نتيجة فعلية
- في فحص جديد، البحث من homepage بكلمة «راي» فتح مباشرة `/s/%D8%B1%D8%A7%D9%8A`.
- صفحة النتائج تعرض cards عمودية: thumbnail YouTube على اليسار، اسم/مدة الفيديو، زرين «تحميل» و«مشاهدة»؛ ظهرت 10 نتائج في الصفحة.
- أول نتيجة هذه المرة كانت video ID `YBETWFkzTtM` بعنوان ظاهر في metadata: `Bilel Tacchini - choufou l’amour madar fiya (Official cover Amine Babylone Live 2023)`، والمدة المعروضة في صفحة media `03:06`.
- رابط أول تحميل: `/media?d=c67f9c51d322bb49623151a96c734bcb`.
- صفحة media تعرض `كود الملف: YBETWFkzTtM`، `المدة: 03:06`، `Mp3@128kbps - Mp4@720p/360p`، وزر `DOWNLOAD NOW` إلى `/videos_dl?v=YBETWFkzTtM`، إضافة إلى رابط خارجي «تحميل مباشر».
- النتيجة قد تتغير بين الطلبات، لكن بنية الرابط والمسار ثابتة.
